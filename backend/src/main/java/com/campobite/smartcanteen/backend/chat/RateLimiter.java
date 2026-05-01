package com.campobite.smartcanteen.backend.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory sliding window rate limiter per user.
 * Tracks request timestamps and evicts expired entries.
 */
@Component
public class RateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RateLimiter.class);

    private final int maxRequests;
    private final long windowMillis;

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<Long>> requestLog = new ConcurrentHashMap<>();

    public RateLimiter(
            @Value("${chatbot.rate-limit.max-requests:20}") int maxRequests,
            @Value("${chatbot.rate-limit.window-seconds:60}") int windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowMillis = windowSeconds * 1000L;
    }

    /**
     * Checks if the user is allowed to make a request.
     * Throws RateLimitExceededException if over the limit.
     */
    public void checkRateLimit(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return;
        }

        long now = System.currentTimeMillis();
        long windowStart = now - windowMillis;

        CopyOnWriteArrayList<Long> timestamps = requestLog.computeIfAbsent(
                userEmail, k -> new CopyOnWriteArrayList<>());

        // Evict expired entries
        timestamps.removeIf(ts -> ts < windowStart);

        if (timestamps.size() >= maxRequests) {
            log.warn("Rate limit exceeded for user: {}", userEmail);
            throw new RateLimitExceededException(
                    "You're sending messages too fast. Please wait a moment before trying again.");
        }

        timestamps.add(now);
    }
}
