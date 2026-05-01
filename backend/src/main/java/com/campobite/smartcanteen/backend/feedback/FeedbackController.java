package com.campobite.smartcanteen.backend.feedback;

import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import com.campobite.smartcanteen.backend.user.User;
import com.campobite.smartcanteen.backend.user.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepo;
    private final OrderRepository orderRepo;
    private final UserRepository userRepo;

    public FeedbackController(
            FeedbackRepository feedbackRepo,
            OrderRepository orderRepo,
            UserRepository userRepo) {
        this.feedbackRepo = feedbackRepo;
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
    }

    /* ================= SUBMIT FEEDBACK ================= */

    @PostMapping("/{orderId}")
    public Map<String, Object> submitFeedback(
            @PathVariable Long orderId,
            @RequestBody FeedbackRequest request,
            Authentication auth) {
        try {
            User user = userRepo.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = orderRepo.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Null-safe check for status
            if (!"COMPLETED".equals(order.getStatus())) {
                throw new RuntimeException(
                        "Feedback allowed only after order completion. Current status: " + order.getStatus());
            }

            if (feedbackRepo.existsByOrderId(orderId)) {
                throw new RuntimeException("Feedback already submitted for order " + orderId);
            }

            Feedback feedback = new Feedback();
            feedback.setOrder(order);
            feedback.setUser(user);
            feedback.setRating(request.getRating());
            feedback.setFoodQuality(request.getFoodQuality());
            feedback.setDeliverySpeed(request.getDeliverySpeed());
            feedback.setComment(request.getComment());
            feedback.setWouldRecommend(request.getWouldRecommend());

            feedbackRepo.save(feedback);

            return Map.of(
                    "message", "Feedback submitted successfully",
                    "orderToken", order.getTokenNumber() != null ? order.getTokenNumber() : 0);
        } catch (Exception e) {
            e.printStackTrace(); // Log to server console
            throw new RuntimeException("Error submitting feedback: " + e.getMessage());
        }
    }
}
