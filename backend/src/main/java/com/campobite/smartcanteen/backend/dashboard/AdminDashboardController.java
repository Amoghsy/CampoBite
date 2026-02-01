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
        public Map<String, Object> dashboard(
                        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "weekly") String range,
                        @org.springframework.web.bind.annotation.RequestParam(required = false) String date) {

                LocalDateTime now = LocalDateTime.now();

                // 1. Determine Anchor Date (The reference point for Demand, Hourly, Peak, Wait)
                // If date is provided, that day is the anchor. If not, Today is the anchor.
                LocalDate anchorDate;
                if (date != null && !date.isEmpty()) {
                        anchorDate = LocalDate.parse(date);
                } else {
                        anchorDate = now.toLocalDate();
                }

                LocalDateTime anchorStartOfDay = anchorDate.atStartOfDay();
                LocalDateTime anchorEndOfDay = anchorStartOfDay.plusDays(1).minusNanos(1);

                /* --- GLOBAL STATS (Relative to Anchor Date) --- */

                // Active Orders: Real-time system status (monitor), regardless of date.
                long activeOrders = orderRepo.countByStatusIn(List.of("ORDERED", "PREPARING", "READY"));

                // Completed ON that specific ANCHOR day
                long completedToday = orderRepo.countByStatusAndCompletedAtBetween("COMPLETED", anchorStartOfDay,
                                anchorEndOfDay);
                Long revenueTodayLogger = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED",
                                anchorStartOfDay,
                                anchorEndOfDay);
                double revenueToday = revenueTodayLogger != null ? revenueTodayLogger : 0;

                // Weekly/Monthly Revenue: Usually these top cards imply "Business Health NOW".
                // But if inspecting a past date, maybe user wants context for THAT date?
                // Standard practice: Top cards often reflect the "Context Date".
                // Let's make them relative to Anchor Date for consistency with "Revenue Today".

                // Weekly Revenue (Last 7 days ENDING on Anchor Date)
                LocalDateTime startOfWeek = anchorStartOfDay.minusDays(6);
                Long revenueWeeklyLogger = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED",
                                startOfWeek, anchorEndOfDay);
                double revenueWeekly = revenueWeeklyLogger != null ? revenueWeeklyLogger : 0;

                // Monthly Revenue (Last 30 days ENDING on Anchor Date)
                LocalDateTime startOfMonth = anchorStartOfDay.minusDays(29);
                Long revenueMonthlyLogger = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED",
                                startOfMonth, anchorEndOfDay);
                double revenueMonthly = revenueMonthlyLogger != null ? revenueMonthlyLogger : 0;

                // Peak Hour (On Anchor Date)
                List<Order> dayOrders = orderRepo.findByCreatedAtBetween(anchorStartOfDay, anchorEndOfDay);
                Map<Integer, Integer> hourCounts = new HashMap<>();
                for (Order o : dayOrders) {
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

                // Avg Wait Time (On Anchor Date)
                List<Order> completedOrders = orderRepo.findByStatusAndCompletedAtBetween("COMPLETED", anchorStartOfDay,
                                anchorEndOfDay);
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
                long totalOrders = orderRepo.count(); // All time default

                /* 📊 ANALYTICS FOR GRAPHS */

                // 1. Demand Analysis (Top Items on Anchor Date)
                List<Map<String, Object>> demandAnalysis = new ArrayList<>();
                List<Object[]> topItems;

                // Use date-range query for Anchor Date
                topItems = orderItemRepo.findTopSellingItemsBetween(anchorStartOfDay, anchorEndOfDay,
                                PageRequest.of(0, 6));

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

                // 2. Sales Trend (ALWAYS Relative to NOW/TODAY per user request)
                // This ignores 'date' parameter and serves business trend for "Current Time"
                List<Map<String, Object>> salesTrend = new ArrayList<>();
                LocalDateTime trendReferenceStart = now.toLocalDate().atStartOfDay(); // Today 00:00
                LocalDateTime trendReferenceEnd = trendReferenceStart.plusDays(1).minusNanos(1); // Today 23:59
                LocalDateTime trendStart;
                DateTimeFormatter trendFormatter;

                if ("monthly".equalsIgnoreCase(range)) {
                        // Monthly: 30 Days ending TODAY
                        trendStart = trendReferenceStart.minusDays(29);
                        trendFormatter = DateTimeFormatter.ofPattern("dd MMM");

                        Map<LocalDate, Double> dailyMap = new LinkedHashMap<>();
                        for (int i = 0; i < 30; i++) {
                                dailyMap.put(trendStart.plusDays(i).toLocalDate(), 0.0);
                        }

                        List<Order> monthOrders = orderRepo.findByCreatedAtBetween(trendStart, trendReferenceEnd);
                        for (Order o : monthOrders) {
                                if (isCompletedOrActive(o)) {
                                        LocalDate d = o.getCreatedAt().toLocalDate();
                                        dailyMap.computeIfPresent(d, (k, v) -> v + o.getTotalAmount());
                                }
                        }

                        dailyMap.forEach((d, amount) -> {
                                salesTrend.add(Map.of(
                                                "label", d.format(trendFormatter),
                                                "revenue", amount));
                        });

                } else if ("weekly".equalsIgnoreCase(range)) {
                        // Weekly: 7 days ending TODAY
                        trendStart = trendReferenceStart.minusDays(6);
                        trendFormatter = DateTimeFormatter.ofPattern("EEE");

                        Map<LocalDate, Double> weeklyMap = new LinkedHashMap<>();
                        for (int i = 0; i < 7; i++) {
                                weeklyMap.put(trendStart.plusDays(i).toLocalDate(), 0.0);
                        }

                        List<Order> weekOrders = orderRepo.findByCreatedAtBetween(trendStart, trendReferenceEnd);
                        for (Order o : weekOrders) {
                                if (isCompletedOrActive(o)) {
                                        LocalDate d = o.getCreatedAt().toLocalDate();
                                        weeklyMap.computeIfPresent(d, (k, v) -> v + o.getTotalAmount());
                                }
                        }

                        weeklyMap.forEach((d, amount) -> {
                                salesTrend.add(Map.of(
                                                "label", d.format(trendFormatter),
                                                "revenue", amount));
                        });

                } else {
                        // Daily (Default): Hourly breakdown of TODAY
                        trendStart = trendReferenceStart;

                        Map<Integer, Double> hourlyRevenue = new LinkedHashMap<>();
                        for (int i = 0; i < 24; i++) {
                                hourlyRevenue.put(i, 0.0);
                        }

                        List<Order> todayOrdersForTrend = orderRepo.findByCreatedAtBetween(trendStart,
                                        trendReferenceEnd);
                        for (Order o : todayOrdersForTrend) {
                                if (isCompletedOrActive(o)) {
                                        int h = o.getCreatedAt().getHour();
                                        hourlyRevenue.put(h, hourlyRevenue.get(h) + o.getTotalAmount());
                                }
                        }

                        hourlyRevenue.forEach((hour, amount) -> {
                                salesTrend.add(Map.of(
                                                "label", String.format("%02d:00", hour),
                                                "revenue", amount));
                        });
                }

                // 3. Hourly Activity (On Anchor Date)
                List<Map<String, Object>> hourlyPattern = new ArrayList<>();
                // Reusing dayOrders (Anchor Start -> Anchor End)

                Map<Integer, Long> hourlyCounts = new HashMap<>();
                for (int h = 9; h <= 21; h++) {
                        hourlyCounts.put(h, 0L);
                }

                for (Order o : dayOrders) {
                        int h = o.getCreatedAt().getHour();
                        hourlyCounts.put(h, hourlyCounts.getOrDefault(h, 0L) + 1);
                }

                hourlyCounts.entrySet().stream()
                                .sorted(Map.Entry.comparingByKey())
                                .forEach(e -> {
                                        if (e.getKey() >= 9 && e.getKey() <= 21) {
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

        private boolean isCompletedOrActive(Order o) {
                return o.getStatus().equals("COMPLETED") || o.getStatus().equals("READY")
                                || o.getStatus().equals("PREPARING") || o.getStatus().equals("ORDERED");
        }
}
