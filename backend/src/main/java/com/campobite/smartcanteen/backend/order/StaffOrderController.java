package com.campobite.smartcanteen.backend.order;

import com.campobite.smartcanteen.backend.notification.NotificationService;
import com.campobite.smartcanteen.backend.notification.EmailService;
import com.campobite.smartcanteen.backend.user.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/staff/orders")
public class StaffOrderController {

    private final OrderRepository orderRepo;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public StaffOrderController(
            OrderRepository orderRepo,
            NotificationService notificationService,
            EmailService emailService) {
        this.orderRepo = orderRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    /* ========== GET ALL ORDERS ========== */
    @GetMapping
    public List<Map<String, Object>> getAllOrders() {
        return orderRepo.findAll().stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("tokenNumber", order.getTokenNumber());
            map.put("status", order.getStatus());
            map.put("totalAmount", order.getTotalAmount());
            map.put("itemNames", order.getItemNames());
            map.put("customerName", order.getUser() != null ? order.getUser().getName() : "Unknown");
            map.put("createdAt", order.getCreatedAt());
            map.put("otpExpiry", order.getOtpExpiry());
            map.put("paymentStatus", order.getPaymentStatus());
            map.put("items", order.getItems());
            return map;
        }).toList();
    }

    /* ========== UPDATE STATUS (PREPARING / READY) ========== */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> payload) {

        String status = payload.get("status");
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Generate OTP when marking READY
        if ("READY".equals(status) && !"READY".equals(order.getStatus())) {
            String otp = String.valueOf((int) (Math.random() * 9000) + 1000);
            order.setOtp(otp);
            order.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));

            try {
                if (order.getUser() != null) {
                    emailService.sendOtpEmail(
                            order.getUser().getEmail(),
                            order.getUser().getName(),
                            order.getTokenNumber(),
                            otp);
                }
            } catch (Exception e) {
                System.err.println("Staff: Failed to send OTP email: " + e.getMessage());
            }
        }

        if ("COMPLETED".equals(status)) {
            order.setCompletedAt(java.time.LocalDateTime.now());
        }

        order.setStatus(status);
        Order savedOrder = orderRepo.save(order);

        // Push FCM notification to customer
        try {
            User user = savedOrder.getUser();
            if (user != null && user.getFcmToken() != null && !user.getFcmToken().isBlank()) {
                notificationService.sendOrderUpdate(
                        user.getFcmToken(),
                        status,
                        savedOrder.getTokenNumber());
            }
        } catch (Exception e) {
            System.err.println("Staff: FCM notification failed: " + e.getMessage());
        }

        return ResponseEntity.ok(savedOrder);
    }

    /* ========== COMPLETE ORDER WITH OTP ========== */
    @PostMapping("/{orderId}/complete")
    public ResponseEntity<?> completeWithOtp(
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

        if (order.getOtpExpiry() != null &&
                order.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(400).body("OTP has expired");
        }

        order.setStatus("COMPLETED");
        order.setCompletedAt(java.time.LocalDateTime.now());
        order.setOtp(null);
        order.setOtpExpiry(null);

        return ResponseEntity.ok(orderRepo.save(order));
    }

    /* ========== RESEND OTP ========== */
    @PostMapping("/{orderId}/resend-otp")
    public ResponseEntity<?> resendOtp(@PathVariable Long orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"READY".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("Order is not in READY state");
        }

        String otp = String.valueOf((int) (Math.random() * 9000) + 1000);
        order.setOtp(otp);
        order.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));
        orderRepo.save(order);

        try {
            if (order.getUser() != null) {
                emailService.sendOtpEmail(
                        order.getUser().getEmail(),
                        order.getUser().getName(),
                        order.getTokenNumber(),
                        otp);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to send OTP email");
        }

        return ResponseEntity.ok("OTP resent successfully");
    }
}
