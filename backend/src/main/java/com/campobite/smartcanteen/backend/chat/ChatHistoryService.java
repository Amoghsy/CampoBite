package com.campobite.smartcanteen.backend.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Manages chat conversation history.
 * Persists messages and builds a context window for Gemini API calls.
 */
@Service
public class ChatHistoryService {

    private static final Logger log = LoggerFactory.getLogger(ChatHistoryService.class);

    private final ChatMessageRepository messageRepository;
    private final int maxMessages;

    public ChatHistoryService(
            ChatMessageRepository messageRepository,
            @Value("${chatbot.history.max-messages:10}") int maxMessages) {
        this.messageRepository = messageRepository;
        this.maxMessages = maxMessages;
    }

    /**
     * Saves a chat message (either user or assistant) to the database.
     */
    public void saveMessage(String userEmail, String role, String content, String intent) {
        try {
            ChatMessage message = new ChatMessage(userEmail, role, content, intent);
            messageRepository.save(message);
        } catch (Exception e) {
            log.error("Failed to save chat message for user {}: {}", userEmail, e.getMessage());
        }
    }

    /**
     * Builds a formatted conversation context string from recent messages.
     * Messages are returned in chronological order (oldest first) for natural
     * reading.
     *
     * @return a multi-line string like "User: ...\nAssistant: ...\n" or empty
     *         string if no history
     */
    public String getRecentHistoryAsContext(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return "";
        }

        try {
            List<ChatMessage> recent = messageRepository
                    .findTop10ByUserEmailOrderByCreatedAtDesc(userEmail);

            if (recent.isEmpty()) {
                return "";
            }

            // Reverse to chronological order (oldest first)
            Collections.reverse(recent);

            // Limit to configured max and format
            return recent.stream()
                    .limit(maxMessages)
                    .map(msg -> (msg.getRole().equals("USER") ? "User" : "Assistant") + ": " + msg.getContent())
                    .collect(Collectors.joining("\n"));

        } catch (Exception e) {
            log.error("Failed to fetch chat history for user {}: {}", userEmail, e.getMessage());
            return "";
        }
    }
}
