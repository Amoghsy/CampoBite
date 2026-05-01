package com.campobite.smartcanteen.backend.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Sanitizes user chat input to prevent prompt injection,
 * XSS, and excessively long messages.
 */
@Component
public class InputSanitizer {

    private static final Logger log = LoggerFactory.getLogger(InputSanitizer.class);
    private static final int MAX_MESSAGE_LENGTH = 500;

    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    private static final List<String> INJECTION_PATTERNS = List.of(
            "ignore previous instructions",
            "ignore all previous",
            "disregard previous",
            "forget your instructions",
            "you are now",
            "act as",
            "pretend you are",
            "system:",
            "assistant:",
            "\\bsystem\\b\\s*:",
            "\\bprompt\\b\\s*:");

    /**
     * Sanitizes the input message:
     * 1. Trims whitespace
     * 2. Strips HTML tags
     * 3. Removes prompt-injection patterns
     * 4. Enforces max length
     */
    public String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String cleaned = input.trim();

        // Strip HTML tags
        cleaned = HTML_TAG_PATTERN.matcher(cleaned).replaceAll("");

        // Remove prompt injection attempts
        String lowerCleaned = cleaned.toLowerCase();
        for (String pattern : INJECTION_PATTERNS) {
            if (lowerCleaned.contains(pattern.toLowerCase())) {
                log.warn("Prompt injection attempt detected and removed: '{}'", pattern);
                cleaned = cleaned.replaceAll("(?i)" + Pattern.quote(pattern), "");
            }
        }

        // Collapse multiple spaces
        cleaned = MULTI_SPACE_PATTERN.matcher(cleaned).replaceAll(" ").trim();

        // Enforce max length
        if (cleaned.length() > MAX_MESSAGE_LENGTH) {
            log.info("Message truncated from {} to {} characters", cleaned.length(), MAX_MESSAGE_LENGTH);
            cleaned = cleaned.substring(0, MAX_MESSAGE_LENGTH);
        }

        return cleaned;
    }
}
