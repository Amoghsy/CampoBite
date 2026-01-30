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
    private final com.campobite.smartcanteen.backend.notification.EmailService emailService;

    public AdminOrderController(OrderRepository orderRepo, NotificationService notificationService,
            com.campobite.smartcanteen.backend.notification.EmailService emailService) {
        this.orderRepo = orderRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
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

        // If marked READY, generate OTP
        if ("READY".equals(status) && !"READY".equals(order.getStatus())) {
            String otp = String.valueOf((int) (Math.random() * 9000) + 1000); // 1000-9999
            order.setOtp(otp);
            order.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));

            // Send OTP Email
            try {
                if (order.getUser() != null) {
                    emailService.sendOtpEmail(
                            order.getUser().getEmail(),
                            order.getUser().getName(),
                            order.getTokenNumber(),
                            otp);
                }
            } catch (Exception e) {
                System.err.println("Failed to send OTP email: " + e.getMessage());
            }
        }

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
                        savedOrder.getTokenNumber());
            }
        } catch (Exception e) {
            // 🔥 DO NOT break the API
            System.err.println("FCM notification failed: " + e.getMessage());
        }

        return ResponseEntity.ok(savedOrder);
    }

    @PostMapping("/{orderId}/complete")
    public ResponseEntity<?> completeOrderWithOtp(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> payload) {

        String submittedOtp = payload.get("otp");
        if (submittedOtp == null || submittedOtp.isBlank()) {
            return ResponseEntity.badRequest().body("OTP is required");
        }

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"READY".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("Order is not in READY state");
        }

        if (order.getOtp() == null || !order.getOtp().equals(submittedOtp)) {
            return ResponseEntity.status(400).body("Invalid OTP");
        }

        if (order.getOtpExpiry() != null && order.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(400).body("OTP has expired");
        }

        // OTP Valid - Mark Completed
        order.setStatus("COMPLETED");
        order.setCompletedAt(java.time.LocalDateTime.now());
        // Clear OTP after use
        order.setOtp(null);
        order.setOtpExpiry(null);

        Order savedOrder = orderRepo.save(order);

        return ResponseEntity.ok(savedOrder);
    }

}
