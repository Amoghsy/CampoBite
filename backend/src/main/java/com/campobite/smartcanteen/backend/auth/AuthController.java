package com.campobite.smartcanteen.backend.auth;

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

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8081")

public class AuthController {

    private final UserRepository userRepo;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;

    @Value("${google.client.id}")
    private String googleClientId;

    public AuthController(
            UserRepository userRepo,
            JwtService jwtService,
            PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.encoder = encoder;
    }

    /* ================= NORMAL SIGNUP ================= */
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
                    "role", user.getRole() // 🔥 IMPORTANT
            ));
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
            user.setRole("STUDENT");
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

            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole()));

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
