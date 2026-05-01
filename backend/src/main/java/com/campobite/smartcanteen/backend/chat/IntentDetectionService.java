package com.campobite.smartcanteen.backend.chat;

import com.campobite.smartcanteen.backend.chat.dto.IntentResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Intelligent intent detection using weighted keyword matching with confidence
 * scoring.
 * Replaces the old ChatIntentDetector with richer NLP preprocessing and
 * expanded intent coverage.
 */
@Service
public class IntentDetectionService {

    private static final Logger log = LoggerFactory.getLogger(IntentDetectionService.class);
    private static final double CONFIDENCE_THRESHOLD = 0.35;

    /**
     * Map of ChatIntent → List of keyword groups. Each group has a weight and a set
     * of keywords.
     */
    private final Map<ChatIntent, List<KeywordGroup>> intentKeywords;

    public IntentDetectionService() {
        this.intentKeywords = buildKeywordMap();
    }

    /**
     * Detects the user's intent from their message.
     * Returns the best-matching intent with a confidence score.
     */
    public IntentResult detect(String rawMessage) {
        if (rawMessage == null || rawMessage.isBlank()) {
            return new IntentResult(ChatIntent.UNKNOWN, 0.0);
        }

        String message = preprocess(rawMessage);
        String[] words = message.split("\\s+");

        // High-priority pattern: user wants to talk to admin/support.
        String lower = message.toLowerCase();
        if ((lower.contains("admin") || lower.contains("support") || lower.contains("helpdesk"))
                && (lower.contains("contact") || lower.contains("speak") || lower.contains("talk")
                        || lower.contains("complain") || lower.contains("issue") || lower.contains("problem"))) {
            return new IntentResult(ChatIntent.CONTACT_ADMIN, 0.95);
        }

        ChatIntent bestIntent = ChatIntent.GENERAL_QUERY;
        double bestScore = 0.0;

        for (Map.Entry<ChatIntent, List<KeywordGroup>> entry : intentKeywords.entrySet()) {
            double score = calculateScore(message, words, entry.getValue());
            if (score > bestScore) {
                bestScore = score;
                bestIntent = entry.getKey();
            }
        }

        // If best score is below threshold, classify as GENERAL_QUERY
        if (bestScore < CONFIDENCE_THRESHOLD) {
            log.debug("No confident intent match for '{}', routing to GENERAL_QUERY (best score: {})",
                    rawMessage, bestScore);
            return new IntentResult(ChatIntent.GENERAL_QUERY, bestScore);
        }

        // Cap confidence at 0.99 for NLP-based detection
        double confidence = Math.min(0.99, bestScore);
        log.info("Detected intent {} with confidence {:.2f} for message: '{}'",
                bestIntent, confidence, rawMessage);

        return new IntentResult(bestIntent, confidence);
    }

    /**
     * NLP preprocessing: lowercase, remove punctuation, collapse whitespace.
     */
    private String preprocess(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Scores how well a message matches a set of keyword groups.
     * Uses weighted sum normalized by total possible weight.
     */
    private double calculateScore(String message, String[] words, List<KeywordGroup> groups) {
        double totalWeight = 0;
        double matchedWeight = 0;

        for (KeywordGroup group : groups) {
            totalWeight += group.weight;
            for (String keyword : group.keywords) {
                if (keyword.contains(" ")) {
                    // Multi-word phrase: check full message
                    if (message.contains(keyword)) {
                        matchedWeight += group.weight;
                        break;
                    }
                } else {
                    // Single word: check word array for exact match
                    for (String word : words) {
                        if (word.equals(keyword)) {
                            matchedWeight += group.weight;
                            break;
                        }
                    }
                    if (matchedWeight >= totalWeight)
                        break;
                }
            }
        }

        return totalWeight > 0 ? matchedWeight / totalWeight : 0.0;
    }

    /**
     * Builds the comprehensive keyword map with weighted groups per intent.
     */
    private Map<ChatIntent, List<KeywordGroup>> buildKeywordMap() {
        Map<ChatIntent, List<KeywordGroup>> map = new LinkedHashMap<>();

        // GREETING
        map.put(ChatIntent.GREETING, List.of(
                new KeywordGroup(1.0, "hello", "hi", "hey", "good morning", "good afternoon",
                        "good evening", "howdy", "greetings", "namaste", "sup", "yo")));

        // ORDER_STATUS
        map.put(ChatIntent.ORDER_STATUS, List.of(
                new KeywordGroup(0.6, "order", "status", "track", "tracking"),
                new KeywordGroup(0.4, "where is my food", "where is my order", "order update",
                        "delivery status", "is my order ready", "how long", "when will",
                        "latest order", "recent order", "my order")));

        // CANCEL_ORDER
        map.put(ChatIntent.CANCEL_ORDER, List.of(
                new KeywordGroup(0.7, "cancel", "cancellation"),
                new KeywordGroup(0.3, "cancel order", "cancel my order", "want to cancel",
                        "stop order", "abort order", "remove order", "refund")));

        // TODAY_MENU
        map.put(ChatIntent.TODAY_MENU, List.of(
                new KeywordGroup(0.5, "today", "available today", "today menu", "todays menu"),
                new KeywordGroup(0.5, "menu", "what food", "whats available", "food available",
                        "what can i eat", "show menu", "menu today", "daily menu",
                        "what items", "food list")));

        // MENU_QUERY (generic menu questions: prices, specific items)
        map.put(ChatIntent.MENU_QUERY, List.of(
                new KeywordGroup(0.5, "menu", "food", "item", "items"),
                new KeywordGroup(0.5, "price", "cost", "how much", "rate", "expensive",
                        "cheap", "list", "available", "category", "categories")));

        // ORDER_PLACE (natural language orders like "give 2 plate samosa")
        map.put(ChatIntent.ORDER_PLACE, List.of(
                new KeywordGroup(0.6, "order", "give", "get", "buy", "want", "need"),
                new KeywordGroup(0.4, "plate", "plates", "piece", "pieces", "x")));

        // CONTACT_ADMIN (user wants to reach admin/support)
        map.put(ChatIntent.CONTACT_ADMIN, List.of(
                new KeywordGroup(0.6, "contact", "admin", "support", "helpdesk"),
                new KeywordGroup(0.4, "i want to contact", "talk to admin", "talk to support",
                        "complaint", "issue with service", "feedback for admin")));

        // TOKEN_QUERY
        map.put(ChatIntent.TOKEN_QUERY, List.of(
                new KeywordGroup(0.6, "token", "token number"),
                new KeywordGroup(0.4, "queue", "my number", "queue number", "waiting number",
                        "what is my token", "whats my token")));

        // WALLET_BALANCE
        map.put(ChatIntent.WALLET_BALANCE, List.of(
                new KeywordGroup(0.7, "wallet", "balance"),
                new KeywordGroup(0.3, "money", "wallet balance", "my balance", "how much balance",
                        "account balance", "credits", "funds")));

        // CANTEEN_TIMINGS
        map.put(ChatIntent.CANTEEN_TIMINGS, List.of(
                new KeywordGroup(0.6, "timing", "timings", "hours", "schedule"),
                new KeywordGroup(0.4, "open", "close", "when does", "canteen open",
                        "canteen close", "opening time", "closing time", "working hours",
                        "operational hours", "canteen time", "what time")));

        // RECOMMENDATION
        map.put(ChatIntent.RECOMMENDATION, List.of(
                new KeywordGroup(0.6, "recommend", "suggestion", "suggest"),
                new KeywordGroup(0.4, "best", "popular", "what should i eat", "top rated",
                        "what do you suggest", "best food", "favorite", "favourite",
                        "must try", "special", "trending")));

        return map;
    }

    /**
     * A group of keywords with an assigned weight for scoring.
     */
    private static class KeywordGroup {
        final double weight;
        final List<String> keywords;

        KeywordGroup(double weight, String... keywords) {
            this.weight = weight;
            this.keywords = List.of(keywords);
        }
    }
}
