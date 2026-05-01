package com.campobite.smartcanteen.backend.auth;
import com.campobite.smartcanteen.backend.notification.GoogleScriptEmailService;
import com.campobite.smartcanteen.backend.notification.EmailService;
import com.campobite.smartcanteen.backend.user.User;
import com.campobite.smartcanteen.backend.user.UserRepository;
import com.campobite.smartcanteen.backend.security.JwtService;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
 @CrossOrigin(origins = "https://campobite.vercel.app")
//@CrossOrigin(origins = "https://localhost:8081")

public class AuthController {
    private final GoogleScriptEmailService googleScriptEmailService;
    private final UserRepository userRepo;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final OtpService otpService;
    private final EmailService emailService;

    @Value("${google.client.id}")
    private String googleClientId;

    // Temporarily stores signup data while awaiting OTP verification
    private final ConcurrentHashMap<String, Map<String, String>> pendingSignups = new ConcurrentHashMap<>();

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

   /* public AuthController(
            UserRepository userRepo,
            JwtService jwtService,
            PasswordEncoder encoder,
            OtpService otpService,
            EmailService emailService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.encoder = encoder;
        this.otpService = otpService;
        this.emailService = emailService;
    }*/
   public AuthController(
           UserRepository userRepo,
           JwtService jwtService,
           PasswordEncoder encoder,
           OtpService otpService,
           EmailService emailService,
           GoogleScriptEmailService googleScriptEmailService) {

       this.userRepo = userRepo;
       this.jwtService = jwtService;
       this.encoder = encoder;
       this.otpService = otpService;
       this.emailService = emailService;
       this.googleScriptEmailService = googleScriptEmailService;
   }

    /* ================= SIGNUP STEP 1: SEND OTP ================= */
    @PostMapping("/signup/send-otp")
    public ResponseEntity<?> signupSendOtp(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String password = body.get("password");
            String role = body.getOrDefault("role", "STUDENT");
            String usn = body.get("usn");

            // Validate name
            if (name == null || name.trim().length() < 2) {
                return ResponseEntity.badRequest().body("Name must be at least 2 characters");
            }

            // Validate email
            if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
                return ResponseEntity.badRequest().body("Please enter a valid email address");
            }

            // Check if already registered
            if (userRepo.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("User already exists");
            }

            // Validate password
            if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
                return ResponseEntity.badRequest()
                        .body("Password must be at least 8 characters with uppercase, lowercase, and a digit");
            }

            // Store signup data temporarily
            Map<String, String> signupData = new java.util.HashMap<>();
            signupData.put("name", name.trim());
            signupData.put("email", email);
            signupData.put("password", password);
            signupData.put("role", role);
            if (usn != null)
                signupData.put("usn", usn);
            pendingSignups.put(email.toLowerCase(), signupData);

            /* Generate and send OTP
            String otp = otpService.generateOtp(email);
            emailService.sendSignupOtpEmail(email, name.trim(), otp);*/
            String otp = otpService.generateOtp(email);

// Use Google Apps Script for OTP email
            googleScriptEmailService.sendSignupOtp(email, name.trim(), otp);
            return ResponseEntity.ok("OTP sent to " + email);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP");
        }
    }

    /* ================= SIGNUP STEP 2: VERIFY OTP ================= */
    @PostMapping("/signup/verify-otp")
    public ResponseEntity<?> signupVerifyOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");

            if (email == null || otp == null) {
                return ResponseEntity.badRequest().body("Email and OTP are required");
            }

            if (!otpService.verifyOtp(email, otp)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired OTP");
            }

            // Get pending signup data
            Map<String, String> signupData = pendingSignups.remove(email.toLowerCase());
            if (signupData == null) {
                return ResponseEntity.badRequest().body("Signup session expired. Please try again.");
            }

            // Check again in case user registered between OTP send and verify
            if (userRepo.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("User already exists");
            }

            // Create user
            User user = new User();
            user.setEmail(signupData.get("email"));
            user.setName(signupData.get("name"));
            user.setPassword(encoder.encode(signupData.get("password")));
            String role = signupData.getOrDefault("role", "STUDENT");
            user.setRole(role);

            if ("STUDENT".equalsIgnoreCase(role) && signupData.get("usn") != null) {
                user.setUsn(signupData.get("usn"));
            }
            user.setRegistered(true);
            user.setAuthProvider("LOCAL");

            userRepo.save(user);
            return ResponseEntity.ok("Account created successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Verification failed");
        }
    }

    /* ================= FORGOT PASSWORD STEP 1: SEND OTP ================= */
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> forgotPasswordSendOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            User user = userRepo.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No account found with this email");
            }

            if ("GOOGLE".equals(user.getAuthProvider())) {
                return ResponseEntity.badRequest()
                        .body("This account uses Google Sign-In. Please login with Google.");
            }

            String otp = otpService.generateOtp(email);
            emailService.sendPasswordResetOtpEmail(email, otp);

            return ResponseEntity.ok("Password reset OTP sent to " + email);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP");
        }
    }

    /* ================= FORGOT PASSWORD STEP 2: RESET ================= */
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> forgotPasswordReset(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            String newPassword = body.get("newPassword");

            if (email == null || otp == null || newPassword == null) {
                return ResponseEntity.badRequest().body("Email, OTP, and new password are required");
            }

            if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
                return ResponseEntity.badRequest()
                        .body("Password must be at least 8 characters with uppercase, lowercase, and a digit");
            }

            if (!otpService.verifyOtp(email, otp)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired OTP");
            }

            User user = userRepo.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            user.setPassword(encoder.encode(newPassword));
            userRepo.save(user);

            return ResponseEntity.ok("Password reset successful");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Password reset failed");
        }
    }

    /*
     * ================= NORMAL SIGNUP (LEGACY - kept for backward compat)
     * =================
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        try {
            if (userRepo.findByEmail(body.get("email")).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("User already exists");
            }

            User user = new User();
            user.setEmail(body.get("email"));
            user.setName(body.get("name"));
            user.setPassword(encoder.encode(body.get("password")));
            String role = body.getOrDefault("role", "STUDENT");
            user.setRole(role);

            if ("STUDENT".equalsIgnoreCase(role)) {
                user.setUsn(body.get("usn"));
            }
            user.setRegistered(true);
            user.setAuthProvider("LOCAL");

            userRepo.save(user);
            return ResponseEntity.ok("Signup successful");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Signup failed");
        }
    }

    /* ================= NORMAL LOGIN ================= */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            User user = userRepo.findByEmail(body.get("email")).orElse(null);

            if (user == null ||
                    !encoder.matches(body.get("password"), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid credentials");
            }

            String jwt = jwtService.generateToken(user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole(),
                    "picture", ""));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed");
        }
    }

    /* ================= GOOGLE SIGNUP ================= */
    @PostMapping("/google/signup")
    public ResponseEntity<?> googleSignup(@RequestBody Map<String, String> body) {
        try {
            GoogleIdToken token = verifyGoogle(body.get("token"));

            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid Google token");
            }

            String email = token.getPayload().getEmail();

            if (userRepo.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Already registered. Please login.");
            }

            User user = new User();
            user.setEmail(email);
            user.setName((String) token.getPayload().get("name"));
            String role = body.getOrDefault("role", "STUDENT").toUpperCase();
            user.setRole(role);
            if ("STUDENT".equalsIgnoreCase(role) && body.get("usn") != null) {
                user.setUsn(body.get("usn"));
            }
            user.setRegistered(true);
            user.setAuthProvider("GOOGLE");

            userRepo.save(user);
            return ResponseEntity.ok("Google signup successful");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Google signup failed");
        }
    }

    /* ================= GOOGLE LOGIN ================= */
    @PostMapping("/google/login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            GoogleIdToken token = verifyGoogle(body.get("token"));

            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid Google token");
            }

            String email = token.getPayload().getEmail();
            User user = userRepo.findByEmail(email).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Please sign up first");
            }

            String jwt = jwtService.generateToken(email);

            String picture = (String) token.getPayload().get("picture");

            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole(),
                    "picture", picture != null ? picture : ""));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Google login failed");
        }
    }

    /* ================= GOOGLE TOKEN VERIFY ================= */
    private GoogleIdToken verifyGoogle(String token) throws Exception {
        if (token == null || token.isEmpty()) {
            return null;
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        return verifier.verify(token);
    }
}
