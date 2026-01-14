package com.campobite.smartcanteen.backend.dashboard;

import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.order.OrderItemRepository;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

        private final OrderRepository orderRepo;
        private final OrderItemRepository orderItemRepo;

        public AdminDashboardController(OrderRepository orderRepo, OrderItemRepository orderItemRepo) {
                this.orderRepo = orderRepo;
                this.orderItemRepo = orderItemRepo;
        }

        @GetMapping
        public Map<String, Object> dashboard() {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
                LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

                long activeOrders = orderRepo.countByStatusIn(List.of("ORDERED", "PREPARING", "READY"));
                long completedToday = orderRepo.countByStatusAndCompletedAtBetween("COMPLETED", startOfDay, endOfDay);
                Long revenueTodayLogger = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED", startOfDay,
                                endOfDay);
                double revenueToday = revenueTodayLogger != null ? revenueTodayLogger : 0;

                // Weekly Revenue
                LocalDateTime startOfWeek = now.minusDays(6).toLocalDate().atStartOfDay(); // Last 7 days
                Long revenueWeeklyLogger = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED",
                                startOfWeek, endOfDay);
                double revenueWeekly = revenueWeeklyLogger != null ? revenueWeeklyLogger : 0;

                // Monthly Revenue
                LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
                Long revenueMonthlyLogger = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED",
                                startOfMonth, endOfDay);
                double revenueMonthly = revenueMonthlyLogger != null ? revenueMonthlyLogger : 0;

                // Peak Hour
                List<Order> todayOrders = orderRepo.findByCreatedAtBetween(startOfDay, endOfDay);
                Map<Integer, Integer> hourCounts = new HashMap<>();
                for (Order o : todayOrders) {
                        int h = o.getCreatedAt().getHour();
                        hourCounts.put(h, hourCounts.getOrDefault(h, 0) + 1);
                }
                String peakHour = "-";
                int maxCount = 0;
                for (Map.Entry<Integer, Integer> entry : hourCounts.entrySet()) {
                        if (entry.getValue() > maxCount) {
                                maxCount = entry.getValue();
                                peakHour = String.format("%02d:00", entry.getKey());
                        }
                }

                // Avg Wait Time
                List<Order> completedOrders = orderRepo.findByStatusAndCompletedAtBetween("COMPLETED", startOfDay,
                                endOfDay);
                double totalWait = 0;
                int count = 0;
                for (Order o : completedOrders) {
                        if (o.getCreatedAt() != null && o.getCompletedAt() != null) {
                                long diff = Duration.between(o.getCreatedAt(), o.getCompletedAt()).toMinutes();
                                totalWait += diff;
                                count++;
                        }
                }
                double avgWaitTime = count > 0 ? totalWait / count : 0;

                long totalOrders = orderRepo.count();

                /* 📊 ANALYTICS FOR GRAPHS */

                // 1. Demand Analysis (Top 6 Items)
                List<Map<String, Object>> demandAnalysis = new ArrayList<>();
                List<Object[]> topItems = orderItemRepo.findTopSellingItems(PageRequest.of(0, 6));

                long maxSold = topItems.isEmpty() ? 1 : (long) topItems.get(0)[1];

                for (Object[] row : topItems) {
                        com.campobite.smartcanteen.backend.menu.MenuItem item = (com.campobite.smartcanteen.backend.menu.MenuItem) row[0];
                        Long sold = (Long) row[1];

                        String demand = "low";
                        if (sold >= maxSold * 0.8)
                                demand = "high";
                        else if (sold >= maxSold * 0.4)
                                demand = "medium";

                        demandAnalysis.add(Map.of(
                                        "name", item.getName(),
                                        "orderCount", sold,
                                        "demand", demand));
                }

                // 2. Sales Trend (Last 7 Days)
                List<Map<String, Object>> salesTrend = new ArrayList<>();
                LocalDateTime sevenDaysAgo = startOfDay.minusDays(6);
                List<Order> weekOrders = orderRepo.findByCreatedAtBetween(sevenDaysAgo, endOfDay);

                DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("EEE");

                // Initialize map for last 7 days
                Map<LocalDate, Long> dailyRevenueMap = new LinkedHashMap<>();
                for (int i = 0; i < 7; i++) {
                        dailyRevenueMap.put(sevenDaysAgo.plusDays(i).toLocalDate(), 0L);
                }

                for (Order o : weekOrders) {
                        LocalDate date = o.getCreatedAt().toLocalDate();
                        if (o.getStatus().equals("COMPLETED") || o.getStatus().equals("READY")
                                        || o.getStatus().equals("PREPARING") || o.getStatus().equals("ORDERED")) {
                                dailyRevenueMap.put(date, dailyRevenueMap.getOrDefault(date, 0L) + o.getTotalAmount());
                        }
                }

                dailyRevenueMap.forEach((date, amount) -> {
                        salesTrend.add(Map.of(
                                        "day", date.format(dayFormatter),
                                        "revenue", amount));
                });

                // 3. Hourly Activity (Today)
                List<Map<String, Object>> hourlyPattern = new ArrayList<>();
                List<Order> todayOrdersListForHours = orderRepo.findByCreatedAtBetween(startOfDay, endOfDay);

                Map<Integer, Long> hourlyCounts = new HashMap<>();
                // Initialize 9 AM to 9 PM (typical hours)
                for (int h = 9; h <= 21; h++) {
                        hourlyCounts.put(h, 0L);
                }

                for (Order o : todayOrdersListForHours) {
                        int h = o.getCreatedAt().getHour();
                        hourlyCounts.put(h, hourlyCounts.getOrDefault(h, 0L) + 1);
                }

                // Sort by hour
                hourlyCounts.entrySet().stream()
                                .sorted(Map.Entry.comparingByKey())
                                .forEach(e -> {
                                        if (e.getKey() >= 9 && e.getKey() <= 21) { // Filter distinct typical hours
                                                hourlyPattern.add(Map.of(
                                                                "hour", String.format("%02d:00", e.getKey()),
                                                                "orders", e.getValue()));
                                        }
                                });

                return Map.ofEntries(
                                Map.entry("activeOrders", activeOrders),
                                Map.entry("completedToday", completedToday),
                                Map.entry("totalOrders", totalOrders),
                                Map.entry("revenueToday", revenueToday),
                                Map.entry("revenueWeekly", revenueWeekly),
                                Map.entry("revenueMonthly", revenueMonthly),
                                Map.entry("peakHour", peakHour),
                                Map.entry("avgWaitTime", Math.round(avgWaitTime)),
                                Map.entry("demandAnalysis", demandAnalysis),
                                Map.entry("salesTrend", salesTrend),
                                Map.entry("hourlyPattern", hourlyPattern));
        }
}
