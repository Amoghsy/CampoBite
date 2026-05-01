package com.campobite.smartcanteen.backend.chat;

import com.campobite.smartcanteen.backend.chat.dto.ChatRequest;
import com.campobite.smartcanteen.backend.chat.dto.ChatResponse;
import com.campobite.smartcanteen.backend.chat.dto.IntentResult;
import com.campobite.smartcanteen.backend.menu.MenuItem;
import com.campobite.smartcanteen.backend.menu.MenuRepository;
import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import com.campobite.smartcanteen.backend.user.User;
import com.campobite.smartcanteen.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Core chat orchestration service.
 * Routes messages to either database queries or Gemini AI based on detected
 * intent.
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final IntentDetectionService intentDetector;
    private final GeminiService geminiService;
    private final ChatHistoryService historyService;
    private final InputSanitizer sanitizer;
    private final OrderRepository orderRepo;
    private final MenuRepository menuRepo;
    private final UserRepository userRepo;
    private final UserQueryRepository queryRepo;
    private final com.campobite.smartcanteen.backend.notification.EmailService emailService;

    public ChatService(IntentDetectionService intentDetector,
            GeminiService geminiService,
            ChatHistoryService historyService,
            InputSanitizer sanitizer,
            OrderRepository orderRepo,
            MenuRepository menuRepo,
            UserRepository userRepo,
            UserQueryRepository queryRepo,
            com.campobite.smartcanteen.backend.notification.EmailService emailService) {
        this.intentDetector = intentDetector;
        this.geminiService = geminiService;
        this.historyService = historyService;
        this.sanitizer = sanitizer;
        this.orderRepo = orderRepo;
        this.menuRepo = menuRepo;
        this.userRepo = userRepo;
        this.queryRepo = queryRepo;
        this.emailService = emailService;
    }

    // ========== Existing UserQuery methods (unchanged) ==========

    public UserQuery submitQuery(String userEmail, String queryText) {
        String userName = "Anonymous";
        if (userEmail != null && !userEmail.equals("Anonymous")) {
            User user = userRepo.findByEmail(userEmail).orElse(null);
            if (user != null && user.getName() != null) {
                userName = user.getName();
            }
        }
        return queryRepo.save(new UserQuery(userEmail, userName, queryText));
    }

    public UserQuery getQuery(Long id) {
        return queryRepo.findById(id).orElse(null);
    }

    public List<UserQuery> getAllQueries() {
        return queryRepo.findAllByOrderByCreatedAtDesc();
    }

    public void replyToQuery(Long queryId, String replyText) {
        UserQuery query = queryRepo.findById(queryId).orElseThrow(() -> new RuntimeException("Query not found"));
        query.setReplyText(replyText);
        query.setReplied(true);
        query.setRepliedAt(java.time.LocalDateTime.now());
        queryRepo.save(query);

        if (query.getUserEmail() != null && !query.getUserEmail().equals("Anonymous")) {
            emailService.sendQueryReply(query.getUserEmail(), query.getQueryText(), replyText);
        }
    }

    // ========== Hybrid AI Chat Processing ==========

    /**
     * Processes a chat message through the hybrid pipeline:
     * 1. Sanitize input
     * 2. Detect intent with confidence
     * 3. Route to database or Gemini
     * 4. Save conversation history
     * 5. Return enriched response
     */
    public ChatResponse processMessage(ChatRequest request, String userEmail) {
        // Step 1: Sanitize
        String cleanMessage = sanitizer.sanitize(request.getMessage());
        if (cleanMessage.isEmpty()) {
            return new ChatResponse(
                    "I didn't catch that. Could you please rephrase?",
                    ChatIntent.UNKNOWN.name(), 0.0, "DATABASE");
        }

        // Step 2: Detect intent
        IntentResult intentResult = intentDetector.detect(cleanMessage);
        ChatIntent intent = intentResult.getIntent();
        double confidence = intentResult.getConfidence();

        log.info("Chat from {}: intent={}, confidence={}, message='{}'",
                userEmail, intent, confidence, cleanMessage);

        // Step 3: Route to handler
        String reply;
        String source;
        OrderPreview orderPreview = null;

        switch (intent) {
            case GREETING:
                reply = handleGreeting(userEmail);
                source = "DATABASE";
                break;

            case ORDER_STATUS:
                reply = handleOrderStatus(userEmail);
                source = "DATABASE";
                break;

            case TOKEN_QUERY:
                reply = handleTokenQuery(userEmail);
                source = "DATABASE";
                break;

            case CANCEL_ORDER:
                reply = handleCancelOrder(userEmail);
                source = "DATABASE";
                break;

            case TODAY_MENU:
            case MENU_QUERY:
                reply = handleMenuQuery();
                source = "DATABASE";
                break;

            case ORDER_PLACE:
                orderPreview = parseOrderFromMessage(cleanMessage);
                if (orderPreview == null) {
                    reply = "I couldn't clearly understand what you want to order. " +
                            "Try something like 'give 2 plate samosa' or 'order 1 masala dosa'.";
                    source = "DATABASE";
                } else {
                    reply = "Got it! I can place an order for " + orderPreview.quantity + " × " +
                            orderPreview.itemName + " (total ₹" + orderPreview.totalAmount + "). " +
                            "I will now open the payment page.";
                    source = "DATABASE";
                }
                break;

            case CONTACT_ADMIN:
                reply = handleContactAdmin(userEmail, cleanMessage);
                source = "DATABASE";
                break;

            case WALLET_BALANCE:
                reply = handleWalletBalance();
                source = "DATABASE";
                break;

            case CANTEEN_TIMINGS:
                reply = handleCanteenTimings();
                source = "DATABASE";
                break;

            case RECOMMENDATION:
                reply = handleRecommendation(userEmail, cleanMessage);
                source = "AI";
                break;

            case GENERAL_QUERY:
            case UNKNOWN:
            default:
                reply = handleGeneralQuery(userEmail, cleanMessage);
                source = "AI";
                break;
        }

        // Step 4: Save to chat history
        historyService.saveMessage(userEmail, "USER", cleanMessage, intent.name());
        historyService.saveMessage(userEmail, "ASSISTANT", reply, intent.name());

        // Step 5: Build and return response
        ChatResponse response = new ChatResponse(reply, intent.name(), confidence, source);
        if (orderPreview != null) {
            response.setAction("OPEN_CHECKOUT");
            response.setMenuItemId(orderPreview.menuItemId);
            response.setQuantity(orderPreview.quantity);
            response.setAmount(orderPreview.totalAmount);
            response.setItemName(orderPreview.itemName);
        }
        return response;
    }

    // ========== Database Handlers ==========

    private String handleGreeting(String userEmail) {
        String name = "there";
        if (userEmail != null) {
            User user = userRepo.findByEmail(userEmail).orElse(null);
            if (user != null && user.getName() != null) {
                name = user.getName().split(" ")[0]; // First name only
            }
        }
        return "Hey " + name + "! 👋 I'm CampoBite Assistant. I can help you with your orders, " +
                "today's menu, canteen timings, and more. What would you like to know?";
    }

    private String handleOrderStatus(String userEmail) {
        if (userEmail == null) {
            return "Please log in to check your order status.";
        }

        User user = userRepo.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return "I couldn't find your account. Please try logging in again.";
        }

        List<Order> orders = orderRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (orders.isEmpty()) {
            return "You haven't placed any orders yet. Head to the menu to place your first order! 🍕";
        }

        Order latest = orders.get(0);
        String statusEmoji = getStatusEmoji(latest.getStatus());
        StringBuilder sb = new StringBuilder();
        sb.append("Your latest order (#").append(latest.getTokenNumber()).append(") ");
        sb.append("is currently ").append(statusEmoji).append(" **").append(latest.getStatus()).append("**.");

        if (latest.getItemNames() != null && !latest.getItemNames().isEmpty()) {
            sb.append("\n📋 Items: ").append(latest.getItemNames());
        }
        if (latest.getTotalAmount() != null) {
            sb.append("\n💰 Total: ₹").append(latest.getTotalAmount());
        }

        return sb.toString();
    }

    private String handleTokenQuery(String userEmail) {
        if (userEmail == null) {
            return "Please log in to check your token number.";
        }

        User user = userRepo.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return "I couldn't find your user details.";
        }

        List<Order> activeOrders = orderRepo.findByUserIdAndStatusIn(
                user.getId(), List.of("PLACED", "PREPARING", "READY"));

        if (activeOrders.isEmpty()) {
            return "You don't have any active orders right now.";
        }

        Order activeOrder = activeOrders.get(0);
        return "Your token number is **" + activeOrder.getTokenNumber() + "** 🎫\n" +
                "Current status: " + getStatusEmoji(activeOrder.getStatus()) + " " + activeOrder.getStatus();
    }

    private String handleCancelOrder(String userEmail) {
        if (userEmail == null) {
            return "Please log in to manage your orders.";
        }

        User user = userRepo.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return "I couldn't find your account.";
        }

        // Only PLACED orders can be cancelled
        var cancelable = orderRepo.findFirstByUserIdAndStatusIn(
                user.getId(), List.of("PLACED"));

        if (cancelable.isEmpty()) {
            return "You don't have any orders that can be cancelled. " +
                    "Orders can only be cancelled when they are in PLACED status.";
        }

        Order order = cancelable.get();
        order.setStatus("CANCELLED");
        orderRepo.save(order);

        return "Your order #" + order.getTokenNumber() + " has been cancelled successfully. ✅\n" +
                "If you paid online, the refund will be processed shortly.";
    }

    private String handleMenuQuery() {
        List<MenuItem> items = menuRepo.findAll().stream()
                .filter(item -> item.getAvailable() != null && item.getAvailable())
                .collect(Collectors.toList());

        if (items.isEmpty()) {
            return "The menu is currently empty. Please check back later! 🕐";
        }

        // Build a plain-text menu summary and let Gemini phrase it nicely.
        String menuSummary = items.stream()
                .map(item -> {
                    String category = item.getCategory() != null ? item.getCategory() : "Other";
                    String price = item.getPrice() != null ? "₹" + item.getPrice() : "price not set";
                    return category + " | " + item.getName() + " | " + price;
                })
                .collect(Collectors.joining("\n"));

        String prompt = "Here is today's canteen menu as raw data (one item per line, format: " +
                "category | name | price):\n\n" + menuSummary + "\n\n" +
                "Write a friendly, clear response describing what is available. " +
                "Use plain text only (no markdown, no asterisks). Keep it short and easy to read.";

        return geminiService.chat(prompt, "");
    }

    private String handleWalletBalance() {
        return "💳 The wallet feature is coming soon! Stay tuned for digital payments " +
                "and balance tracking in CampoBite. 🚀";
    }

    private String handleCanteenTimings() {
        return "🕐 **CampoBite Canteen Timings:**\n\n" +
                "Breakfast: 8:00 AM – 10:00 AM\n" +
                "Lunch: 12:00 PM – 2:30 PM\n" +
                "Snacks: 4:00 PM – 5:30 PM\n" +
                "Dinner: 7:00 PM – 9:00 PM\n\n" +
                "Timings may vary on holidays and weekends.";
    }

    // ========== AI Handlers ==========

    private String handleRecommendation(String userEmail, String message) {
        // Build context about available menu items for Gemini
        List<MenuItem> available = menuRepo.findAll().stream()
                .filter(item -> item.getAvailable() != null && item.getAvailable())
                .collect(Collectors.toList());

        String menuContext = available.stream()
                .map(item -> item.getName() + " (₹" + item.getPrice() + ", " + item.getCategory() + ")")
                .collect(Collectors.joining(", "));

        String historyContext = historyService.getRecentHistoryAsContext(userEmail);
        String enhancedMessage = "The user is asking for food recommendations. " +
                "Available menu items: [" + menuContext + "]. " +
                "User's message: " + message;

        return geminiService.chat(enhancedMessage, historyContext);
    }

    private String handleGeneralQuery(String userEmail, String message) {
        String historyContext = historyService.getRecentHistoryAsContext(userEmail);
        return geminiService.chat(message, historyContext);
    }

    private String handleContactAdmin(String userEmail, String message) {
        if (userEmail == null) {
            return "You need to be logged in so I can attach your details to the message for the admin.";
        }

        // Check if the user actually provided a message, or just asked to talk
        String normalized = message.toLowerCase();
        String stripped = normalized
                .replace("admin", "")
                .replace("support", "")
                .replace("helpdesk", "")
                .replace("contact", "")
                .replace("speak", "")
                .replace("talk", "")
                .replace("complain", "")
                .replace("complaint", "")
                .replace("issue", "")
                .replace("problem", "")
                .replaceAll("\\s+", " ")
                .trim();

        // If nothing meaningful remains, ask the user for the actual message
        if (stripped.isBlank() || stripped.split(" ").length <= 2) {
            return "Sure, I can connect you with the admin team. " +
                    "Please type the message you want me to send them (for example, what went wrong with your order).";
        }

        submitQuery(userEmail, message);
        return "I have sent your message to the admin team. " +
                "They will review it and get back to you soon.";
    }

    // ========== Utilities ==========

    private String getStatusEmoji(String status) {
        if (status == null)
            return "❓";
        return switch (status.toUpperCase()) {
            case "PLACED" -> "📥";
            case "PREPARING" -> "👨‍🍳";
            case "READY" -> "✅";
            case "PICKED_UP", "COMPLETED" -> "🎉";
            case "CANCELLED" -> "❌";
            default -> "📋";
        };
    }

    // ========== Order parsing for chat-based ordering ==========

    /**
     * Parses a natural language message like "give 2 plate samosa" into an order preview.
     * Uses simple heuristics and menu name matching.
     */
    private OrderPreview parseOrderFromMessage(String message) {
        if (message == null || message.isBlank()) {
            return null;
        }

        String normalized = message.toLowerCase().trim();
        normalized = normalized
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();

        // Try to extract quantity and item phrase: "<qty> [plate/plates/x] <item name>"
        int quantity = 1;
        String itemPhrase = normalized;

        String[] tokens = normalized.split("\\s+");
        for (int i = 0; i < tokens.length; i++) {
            String t = tokens[i];
            // Handle small spelling/word variations for quantity (e.g. "two dosa")
            Integer wordQty = parseSmallNumberWord(t);
            if (wordQty != null) {
                quantity = Math.max(1, wordQty);
                int startIdx = i + 1;
                if (startIdx < tokens.length &&
                        (tokens[startIdx].startsWith("plate") ||
                                tokens[startIdx].startsWith("piece") ||
                                tokens[startIdx].equals("x"))) {
                    startIdx++;
                }
                if (startIdx < tokens.length) {
                    itemPhrase = String.join(" ", java.util.Arrays.copyOfRange(tokens, startIdx, tokens.length));
                }
                break;
            }

            try {
                int q = Integer.parseInt(t);
                quantity = Math.max(1, q);
                // Skip optional unit immediately after quantity
                int startIdx = i + 1;
                if (startIdx < tokens.length &&
                        (tokens[startIdx].startsWith("plate") ||
                                tokens[startIdx].startsWith("piece") ||
                                tokens[startIdx].equals("x"))) {
                    startIdx++;
                }
                if (startIdx < tokens.length) {
                    itemPhrase = String.join(" ", java.util.Arrays.copyOfRange(tokens, startIdx, tokens.length));
                }
                break;
            } catch (NumberFormatException ignored) {
                // keep scanning
            }
        }

        // Remove common verbs from the beginning of the item phrase
        itemPhrase = itemPhrase
                .replaceFirst("^(please\\s+)?(give|get|order|buy|i want|i need)\\s+", "")
                .trim();

        if (itemPhrase.isBlank()) {
            return null;
        }

        // Find a matching available menu item (tolerant to minor typos)
        final String needle = normalizeForMatch(itemPhrase);
        if (needle.isBlank()) {
            return null;
        }

        MenuItem matched = null;
        double bestScore = 0.0;
        for (MenuItem item : menuRepo.findAll()) {
            if (item.getAvailable() == null || !item.getAvailable()) {
                continue;
            }
            if (item.getName() == null || item.getPrice() == null) {
                continue;
            }

            String nameNorm = normalizeForMatch(item.getName());
            if (nameNorm.isBlank()) {
                continue;
            }

            double score = scoreFuzzyMatch(needle, nameNorm);
            if (score > bestScore) {
                bestScore = score;
                matched = item;
            }
        }

        // Require reasonable confidence to avoid wrong orders on fuzzy matches
        if (matched == null || bestScore < 0.62) {
            return null;
        }

        int totalAmount = matched.getPrice() * quantity;
        OrderPreview preview = new OrderPreview();
        preview.menuItemId = matched.getId();
        preview.itemName = matched.getName();
        preview.quantity = quantity;
        preview.totalAmount = totalAmount;
        return preview;
    }

    private static String normalizeForMatch(String s) {
        if (s == null) {
            return "";
        }
        return s.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Scores how well {@code needle} matches {@code haystack}, allowing small typos.
     * Values are in [0,1], where 1 is an exact/contain match.
     */
    private static double scoreFuzzyMatch(String needle, String haystack) {
        if (needle.isBlank() || haystack.isBlank()) {
            return 0.0;
        }

        if (haystack.contains(needle)) {
            return 1.0;
        }

        double phraseSim = similarity(needle, haystack);

        String[] needleTokens = needle.split("\\s+");
        String[] hayTokens = haystack.split("\\s+");
        double tokenSum = 0.0;
        for (String nTok : needleTokens) {
            double bestTok = 0.0;
            for (String hTok : hayTokens) {
                bestTok = Math.max(bestTok, similarity(nTok, hTok));
                if (bestTok >= 0.95) {
                    break;
                }
            }
            tokenSum += bestTok;
        }
        double tokenAvg = tokenSum / Math.max(1, needleTokens.length);

        return Math.max(phraseSim, tokenAvg);
    }

    private static double similarity(String a, String b) {
        if (a == null || b == null) {
            return 0.0;
        }
        if (a.equals(b)) {
            return 1.0;
        }
        if (a.isBlank() || b.isBlank()) {
            return 0.0;
        }
        int dist = levenshteinDistance(a, b);
        int max = Math.max(a.length(), b.length());
        if (max == 0) {
            return 1.0;
        }
        return 1.0 - ((double) dist / (double) max);
    }

    private static int levenshteinDistance(String a, String b) {
        int n = a.length();
        int m = b.length();
        int[] prev = new int[m + 1];
        int[] curr = new int[m + 1];

        for (int j = 0; j <= m; j++) {
            prev[j] = j;
        }
        for (int i = 1; i <= n; i++) {
            curr[0] = i;
            char ca = a.charAt(i - 1);
            for (int j = 1; j <= m; j++) {
                int cost = (ca == b.charAt(j - 1)) ? 0 : 1;
                curr[j] = Math.min(
                        Math.min(curr[j - 1] + 1, prev[j] + 1),
                        prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[m];
    }

    private static Integer parseSmallNumberWord(String token) {
        if (token == null) {
            return null;
        }
        return switch (token) {
            case "a", "an", "one" -> 1;
            case "two" -> 2;
            case "three" -> 3;
            case "four" -> 4;
            case "five" -> 5;
            case "six" -> 6;
            case "seven" -> 7;
            case "eight" -> 8;
            case "nine" -> 9;
            case "ten" -> 10;
            default -> null;
        };
    }

    private static class OrderPreview {
        Long menuItemId;
        String itemName;
        Integer quantity;
        Integer totalAmount;
    }
}
