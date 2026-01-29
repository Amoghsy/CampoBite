package com.campobite.smartcanteen.backend.order;

import com.campobite.smartcanteen.backend.notification.NotificationService;
import com.campobite.smartcanteen.backend.user.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;


import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderRepository orderRepo;
    private final NotificationService notificationService;

    public AdminOrderController(OrderRepository orderRepo, NotificationService notificationService) {
        this.orderRepo = orderRepo;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Map<String, Object>> getAllOrders() {
        return orderRepo.findAll().stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("tokenNumber", order.getTokenNumber());
            map.put("status", order.getStatus());
            map.put("totalAmount", order.getTotalAmount());
            map.put("customerName", order.getUser().getName());
            map.put("createdAt", order.getCreatedAt());
            map.put("items", order.getItems());
            return map;
        }).toList();
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> payload) {

        String status = payload.get("status");

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if ("COMPLETED".equals(status)) {
            order.setCompletedAt(java.time.LocalDateTime.now());
        }

        order.setStatus(status);
        Order savedOrder = orderRepo.save(order);

        try {
            User user = savedOrder.getUser();
            if (user != null &&
                    user.getFcmToken() != null &&
                    !user.getFcmToken().isBlank()) {

                notificationService.sendOrderUpdate(
                        user.getFcmToken(),
                        status,
                        savedOrder.getTokenNumber()
                );
            }
        } catch (Exception e) {
            // 🔥 DO NOT break the API
            System.err.println("FCM notification failed: " + e.getMessage());
        }

        return ResponseEntity.ok(savedOrder);
    }


}
