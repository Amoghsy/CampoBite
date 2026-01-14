package com.campobite.smartcanteen.backend.chat;

import com.campobite.smartcanteen.backend.chat.dto.ChatRequest;
import com.campobite.smartcanteen.backend.chat.dto.ChatResponse;
import com.campobite.smartcanteen.backend.menu.MenuItem;
import com.campobite.smartcanteen.backend.menu.MenuRepository;
import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import com.campobite.smartcanteen.backend.user.User;
import com.campobite.smartcanteen.backend.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatIntentDetector intentDetector;
    private final OrderRepository orderRepo;
    private final MenuRepository menuRepo;
    private final UserRepository userRepo;
    private final UserQueryRepository queryRepo;
    private final com.campobite.smartcanteen.backend.notification.EmailService emailService;

    public ChatService(ChatIntentDetector intentDetector, OrderRepository orderRepo, MenuRepository menuRepo,
            UserRepository userRepo, UserQueryRepository queryRepo,
            com.campobite.smartcanteen.backend.notification.EmailService emailService) {
        this.intentDetector = intentDetector;
        this.orderRepo = orderRepo;
        this.menuRepo = menuRepo;
        this.userRepo = userRepo;
        this.queryRepo = queryRepo;
        this.emailService = emailService;
    }

    public UserQuery submitQuery(String userEmail, String queryText) {
        return queryRepo.save(new UserQuery(userEmail, queryText));
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

        // Send email
        if (query.getUserEmail() != null && !query.getUserEmail().equals("Anonymous")) {
            emailService.sendQueryReply(query.getUserEmail(), query.getQueryText(), replyText);
        }
    }

    public ChatResponse processMessage(ChatRequest request, String userEmail) {
        ChatIntent intent = intentDetector.detect(request.getMessage());
        String responseText = "";

        switch (intent) {
            case GREETING:
                responseText = "Hello! I'm CampoBite Assistant. How can I help you today?";
                break;

            case ORDER_STATUS:
                if (userEmail == null) {
                    responseText = "Please log in to check your order status.";
                } else {
                    User user = userRepo.findByEmail(userEmail).orElse(null);
                    if (user != null) {
                        List<Order> orders = orderRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
                        if (orders.isEmpty()) {
                            responseText = "You haven't placed any orders yet.";
                        } else {
                            Order latest = orders.get(0);
                            responseText = "Your latest order (#" + latest.getTokenNumber() + ") is currently "
                                    + latest.getStatus() + ".";
                        }
                    } else {
                        responseText = "I couldn't find your user details.";
                    }
                }
                break;

            case TOKEN_QUERY:
                if (userEmail == null) {
                    responseText = "Please log in to check your token number.";
                } else {
                    User user = userRepo.findByEmail(userEmail).orElse(null);
                    if (user != null) {
                        List<Order> orders = orderRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
                        if (orders.isEmpty()) {
                            responseText = "You don't have any active orders.";
                        } else {
                            Order latest = orders.get(0);
                            responseText = "Your token number is " + latest.getTokenNumber() + ".";
                        }
                    } else {
                        responseText = "I couldn't find your user details.";
                    }
                }
                break;

            case MENU_QUERY:
                List<MenuItem> items = menuRepo.findAll();
                if (items.isEmpty()) {
                    responseText = "The menu is currently empty.";
                } else {
                    String popular = items.stream().limit(3).map(MenuItem::getName).collect(Collectors.joining(", "));
                    responseText = "We have many delicious items! Some popular ones are: " + popular
                            + ". You can check the full menu in the Menu tab.";
                }
                break;

            case RECOMMENDATION:
                // Reuse recommendation logic or simple fallback
                List<MenuItem> recs = menuRepo.findAll(); // specific logic can be added later
                if (recs.isEmpty()) {
                    responseText = "I can't recommend anything right now.";
                } else {
                    MenuItem randomItem = recs.get(new Random().nextInt(recs.size()));
                    responseText = "How about trying our " + randomItem.getName() + "? It's quite good!";
                }
                break;

            default:
                responseText = "I'm sorry, I didn't quite catch that. You can ask me about your order status, menu items, or recommendations.";
        }

        return new ChatResponse(responseText, intent.name());
    }
}
