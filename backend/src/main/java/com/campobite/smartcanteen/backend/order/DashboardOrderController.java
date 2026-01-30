package com.campobite.smartcanteen.backend.order;

import com.campobite.smartcanteen.backend.menu.MenuItem;
import com.campobite.smartcanteen.backend.menu.MenuRepository;
import com.campobite.smartcanteen.backend.user.User;
import com.campobite.smartcanteen.backend.user.UserRepository;
import com.campobite.smartcanteen.backend.notification.EmailService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/orders")
public class DashboardOrderController {

    private final OrderRepository orderRepository;
    private final MenuRepository menuRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final com.campobite.smartcanteen.backend.discount.CouponRepository couponRepository;
    private final com.campobite.smartcanteen.backend.notification.NotificationService notificationService;

    public DashboardOrderController(
            OrderRepository orderRepository,
            MenuRepository menuRepository,
            UserRepository userRepository,
            EmailService emailService,
            com.campobite.smartcanteen.backend.discount.CouponRepository couponRepository,
            com.campobite.smartcanteen.backend.notification.NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.menuRepository = menuRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.couponRepository = couponRepository;
        this.notificationService = notificationService;
    }

    /* ================= PLACE ORDER ================= */
    @PostMapping
    public Order placeOrder(
            @RequestBody OrderRequest request,
            Authentication authentication) {
        /* 🔐 AUTH */
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        /* 🧾 CREATE ORDER */
        Order order = new Order();
        order.setUser(user);
        order.setStatus("ORDERED");
        order.setTotalAmount(request.getTotalAmount());
        order.setTokenNumber(generateToken());

        List<OrderItem> orderItems = new ArrayList<>();

        System.out.println("ORDER REQUEST: " + request);
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Order must contain items");
        }

        /* 📦 CREATE ORDER ITEMS */
        for (OrderRequest.Item reqItem : request.getItems()) {

            System.out.println("PROCESSING ITEM: " + reqItem.getMenuItemId());
            MenuItem menuItem = menuRepository
                    .findById(reqItem.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(reqItem.getQuantity());
            orderItem.setPriceAtOrder(menuItem.getPrice());

            orderItems.add(orderItem);
        }

        /* 📝 SET ITEM NAMES SUMMARY */
        String names = orderItems.stream()
                .map(item -> item.getMenuItem().getName() + " x" + item.getQuantity())
                .collect(java.util.stream.Collectors.joining(", "));
        order.setItemNames(names);

        order.setItems(orderItems);

        /* 🏷️ APPLY COUPON */
        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            String code = request.getCouponCode().toUpperCase();
            com.campobite.smartcanteen.backend.discount.Coupon coupon = couponRepository.findByCode(code)
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive()) {
                throw new RuntimeException("Coupon is inactive");
            }

            if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(java.time.LocalDate.now())) {
                throw new RuntimeException("Coupon has expired");
            }

            double discount = (order.getTotalAmount() * coupon.getDiscountPercentage()) / 100.0;
            order.setDiscountAmount(discount);
            order.setCouponCode(code);
            order.setTotalAmount((int) (order.getTotalAmount() - discount));
        }

        /* 💾 SAVE (CASCADE SAVES ITEMS) */
        Order savedOrder = orderRepository.save(order);

        /* 🔔 NOTIFY ADMIN */
        notificationService.sendTopicNotification(
                "admin",
                "New Order Received! 🛍️",
                "Order #" + savedOrder.getTokenNumber() + " - ₹" + savedOrder.getTotalAmount(),
                java.util.Map.of("orderId", String.valueOf(savedOrder.getId())));

        /* 🔔 SEND EMAIL AFTER TOKEN IS GENERATED */
        try {
            emailService.sendOrderConfirmation(
                    user.getEmail(),
                    user.getName(),
                    savedOrder.getTokenNumber(),
                    savedOrder.getTotalAmount(),
                    savedOrder.getItems());
        } catch (Exception e) {
            System.err.println("Failed to send order confirmation email: " + e.getMessage());
        }

        return savedOrder;
    }

    /* ================= CANCEL ORDER ================= */
    @PutMapping("/{orderId}/cancel")
    public Order cancelOrder(
            @PathVariable Long orderId,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Ensure order belongs to user
        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        // Ensure status is ORDERED
        if (!"ORDERED".equals(order.getStatus())) {
            throw new RuntimeException("Cannot cancel order in status: " + order.getStatus());
        }

        order.setStatus("CANCELLED");
        return orderRepository.save(order);
    }

    /* ================= TOKEN GENERATOR ================= */
    private int generateToken() {
        return new Random().nextInt(900) + 100; // 100–999
    }
}