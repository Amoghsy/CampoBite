package com.campobite.smartcanteen.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Retrieves the most recent chat messages for a user, ordered newest-first.
     * Spring Data automatically limits to top N based on method name.
     */
    List<ChatMessage> findTop10ByUserEmailOrderByCreatedAtDesc(String userEmail);
}
