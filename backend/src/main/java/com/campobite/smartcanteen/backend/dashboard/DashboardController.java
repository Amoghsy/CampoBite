package com.campobite.smartcanteen.backend.dashboard;

import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import com.campobite.smartcanteen.backend.user.User;
import com.campobite.smartcanteen.backend.user.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

        private final OrderRepository orderRepo;
        private final UserRepository userRepo;

        public DashboardController(
                        OrderRepository orderRepo,
                        UserRepository userRepo) {
                this.orderRepo = orderRepo;
                this.userRepo = userRepo;
        }

        @GetMapping
        public Map<String, Object> dashboard(Authentication auth) {

                System.out.println("DASHBOARD AUTH: " + auth);
                if (auth != null) {
                        System.out.println("AUTH NAME: " + auth.getName());
                }

                if (auth == null) {
                        // Guest user
                        Map<String, Object> response = new HashMap<>();
                        response.put("user", Map.of(
                                        "email", "guest@example.com",
                                        "name", "Guest User"));
                        response.put("activeOrder", null);
                        response.put("orderHistory", List.of());
                        return response;
                }

                // Logged-in user
                User user = userRepo.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found for email: " + auth.getName()));

                Order activeOrder = orderRepo
                                .findFirstByUserIdAndStatusIn(
                                                user.getId(),
                                                List.of("ORDERED", "PREPARING", "READY"))
                                .orElse(null);

                List<Order> history = orderRepo.findByUserIdOrderByCreatedAtDesc(user.getId());

                Map<String, Object> userMap = new HashMap<>();
                userMap.put("email", user.getEmail());
                userMap.put("name", user.getName());
                userMap.put("role", user.getRole());
                userMap.put("usn", user.getUsn());

                Map<String, Object> response = new HashMap<>();
                response.put("user", userMap);
                response.put("activeOrder", activeOrder);
                response.put("orderHistory", history);

                return response;
        }

}
