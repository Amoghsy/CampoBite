package com.campobite.smartcanteen.backend.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    private String role;

    private boolean registered = true;

    @Column(name = "auth_provider")
    private String authProvider;

    @Column(name = "fcm_token")
    private String fcmToken;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "usn")
    private String usn;

    @Column(name = "phone")
    private String phone;

    // ===== GETTERS =====
    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

    public String getRole() {
        return role;
    }

    public boolean isRegistered() {
        return registered;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    // ===== SETTERS =====
    public void setEmail(String email) {
        this.email = email;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setRegistered(boolean registered) {
        this.registered = registered;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public String getUsn() {
        return usn;
    }

    public void setUsn(String usn) {
        this.usn = usn;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
