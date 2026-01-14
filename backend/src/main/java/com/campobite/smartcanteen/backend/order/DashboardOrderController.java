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

    public DashboardOrderController(
            OrderRepository orderRepository,
            MenuRepository menuRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.orderRepository = orderRepository;
        this.menuRepository = menuRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
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

        /* 💾 SAVE (CASCADE SAVES ITEMS) */
        Order savedOrder = orderRepository.save(order);

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

    /* ================= TOKEN GENERATOR ================= */
    private int generateToken() {
        return new Random().nextInt(900) + 100; // 100–999
    }
}