package com.campobite.smartcanteen.backend.chat;

/**
 * Thrown when a user exceeds the chat rate limit.
 * Handled in the controller to return HTTP 429.
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
