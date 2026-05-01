package com.campobite.smartcanteen.backend.chat;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Persists individual chat messages for conversation history.
 * Stores both user and assistant messages to enable contextual AI responses.
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_messages_user_email", columnList = "userEmail"),
        @Index(name = "idx_chat_messages_created_at", columnList = "createdAt")
})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    /** Either "USER" or "ASSISTANT" */
    @Column(nullable = false, length = 10)
    private String role;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String intent;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public ChatMessage() {
    }

    public ChatMessage(String userEmail, String role, String content, String intent) {
        this.userEmail = userEmail;
        this.role = role;
        this.content = content;
        this.intent = intent;
    }

    public Long getId() {
        return id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public String getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public String getIntent() {
        return intent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
