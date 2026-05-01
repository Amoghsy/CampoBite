package com.campobite.smartcanteen.backend.chat;

import com.campobite.smartcanteen.backend.chat.dto.ChatRequest;
import com.campobite.smartcanteen.backend.chat.dto.ChatResponse;
import com.campobite.smartcanteen.backend.chat.dto.UserQueryRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for the hybrid AI chatbot.
 * Requires JWT authentication for the main chat endpoint.
 * Includes rate limiting to prevent abuse.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final RateLimiter rateLimiter;

    public ChatController(ChatService chatService, RateLimiter rateLimiter) {
        this.chatService = chatService;
        this.rateLimiter = rateLimiter;
    }

    /**
     * Main chat endpoint — requires JWT authentication.
     * Rate-limited per user.
     */
    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatRequest request, Authentication authentication) {
        String userEmail = authentication.getName();

        // Rate limit check
        try {
            rateLimiter.checkRateLimit(userEmail);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "error", "RATE_LIMIT_EXCEEDED",
                            "message", e.getMessage()));
        }

        ChatResponse response = chatService.processMessage(request, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit a user query (can be anonymous).
     */
    @PostMapping("/query")
    public Long submitQuery(@RequestBody UserQueryRequest request, Authentication authentication) {
        String userEmail = (authentication != null) ? authentication.getName() : "Anonymous";
        return chatService.submitQuery(userEmail, request.getQuery()).getId();
    }

    /**
     * Get a specific query by ID.
     */
    @GetMapping("/query/{id}")
    public UserQuery getQuery(@PathVariable Long id) {
        return chatService.getQuery(id);
    }
}
