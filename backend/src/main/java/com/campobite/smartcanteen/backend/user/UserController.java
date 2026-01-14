package com.campobite.smartcanteen.backend.user;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepo;

    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepo,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /* ================= GET USER PROFILE ================= */
    @GetMapping("/me")
    public User getUserProfile(Authentication auth) {
        return userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /* ================= UPDATE PROFILE ================= */
    @PutMapping("/update")
    public org.springframework.http.ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (body.containsKey("email")) {
            user.setEmail(body.get("email"));
        }
        if (body.containsKey("phone")) {
            user.setPhone(body.get("phone"));
        }
        // Only allow USN update if currently empty
        if (body.containsKey("usn")) {
            String newUsn = body.get("usn");
            if (user.getUsn() == null || user.getUsn().trim().isEmpty()) {
                user.setUsn(newUsn);
            } else if (!user.getUsn().equals(newUsn)) {
                // Trying to change existing USN
                return org.springframework.http.ResponseEntity.badRequest().body("USN cannot be changed once set.");
            }
        }

        userRepo.save(user);
        return org.springframework.http.ResponseEntity.ok(user);
    }

    /* ================= CHANGE PASSWORD ================= */
    @PostMapping("/change-password")
    public org.springframework.http.ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 6) {
            return org.springframework.http.ResponseEntity.badRequest()
                    .body("New password must be at least 6 characters");
        }

        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return org.springframework.http.ResponseEntity.status(400).body("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        return org.springframework.http.ResponseEntity.ok("Password updated successfully");
    }

    /* ================= SAVE FCM TOKEN ================= */

    @PostMapping("/fcm-token")
    public void saveFcmToken(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String token = body.get("token");

        if (token == null || token.isBlank())
            return;

        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFcmToken(token);
        userRepo.save(user);
    }
}
