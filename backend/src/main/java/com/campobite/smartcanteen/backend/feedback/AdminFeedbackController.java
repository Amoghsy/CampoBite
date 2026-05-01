package com.campobite.smartcanteen.backend.feedback;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/feedbacks")
public class AdminFeedbackController {

    private final FeedbackRepository feedbackRepo;

    public AdminFeedbackController(FeedbackRepository feedbackRepo) {
        this.feedbackRepo = feedbackRepo;
    }

    @GetMapping
    public List<Map<String, Object>> getAllFeedbacks() {
        return feedbackRepo.findAll().stream().map(feedback -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", feedback.getId());
            map.put("orderId", feedback.getOrder().getId());
            map.put("orderToken", feedback.getOrder().getTokenNumber());
            map.put("customerName", feedback.getUser().getName());
            map.put("rating", feedback.getRating());
            map.put("foodQuality", feedback.getFoodQuality());
            map.put("deliverySpeed", feedback.getDeliverySpeed());
            map.put("comment", feedback.getComment());
            map.put("wouldRecommend", feedback.getWouldRecommend());
            map.put("createdAt", feedback.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }
}
