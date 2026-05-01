package com.campobite.smartcanteen.backend.notification;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Simple endpoint to fire a notification to a specific token or topic.
     * Useful for testing mobile/web behaviour without having to update an order
     * or create a coupon.
     *
     * Request body may contain either `token` (single user) or `topic`.
     * `title` and `body` are required. Additional data fields may be provided
     * via the `data` map.
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendTestNotification(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String msg = (String) body.get("body");
        Map<String, String> data = (Map<String, String>) body.get("data");
        if (title == null || msg == null) {
            return ResponseEntity.badRequest().body("title and body required");
        }

        if (body.containsKey("token")) {
            String token = (String) body.get("token");
            notificationService.sendTokenNotification(token, title, msg, data);
        } else if (body.containsKey("topic")) {
            String topic = (String) body.get("topic");
            notificationService.sendTopicNotification(topic, title, msg, data);
        } else {
            return ResponseEntity.badRequest().body("token or topic required");
        }

        return ResponseEntity.ok("sent");
    }
}