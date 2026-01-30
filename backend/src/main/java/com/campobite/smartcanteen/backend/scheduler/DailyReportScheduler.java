package com.campobite.smartcanteen.backend.scheduler;

import com.campobite.smartcanteen.backend.notification.EmailService;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import com.campobite.smartcanteen.backend.order.OrderItemRepository;
import com.campobite.smartcanteen.backend.menu.MenuItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DailyReportScheduler {

    private final OrderRepository orderRepo;
    private final EmailService emailService;
    private final OrderItemRepository orderItemRepo;

    @Value("${admin.email}")
    private String adminEmail;

    public DailyReportScheduler(OrderRepository orderRepo, EmailService emailService,
            OrderItemRepository orderItemRepo) {
        this.orderRepo = orderRepo;
        this.emailService = emailService;
        this.orderItemRepo = orderItemRepo;
    }

    // Run every day at 11:59 PM
    @Scheduled(cron = "0 59 23 * * *")
    public void sendDailyReport() {
        System.out.println("Generating Daily Report...");

        // Define Start and End of Day
        LocalDateTime start = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        String reportDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

        // 1. Total Created Orders Today
        List<com.campobite.smartcanteen.backend.order.Order> allOrdersToday = orderRepo.findByCreatedAtBetween(start,
                end);
        long totalOrders = allOrdersToday.size();

        // 2. Total Revenue (Completed Only)
        Long revenueCents = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED", start, end);
        double totalRevenue = (revenueCents != null) ? revenueCents : 0.0;

        // 3. Status Breakdown
        Map<String, Long> statusCounts = allOrdersToday.stream()
                .collect(Collectors.groupingBy(com.campobite.smartcanteen.backend.order.Order::getStatus,
                        Collectors.counting()));

        StringBuilder statusBreakdownHtml = new StringBuilder();
        statusCounts.forEach((status, count) -> {
            String color = getStatusColor(status);
            statusBreakdownHtml.append(String.format(
                    """
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                        <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; background-color: %s; color: white; font-size: 11px; font-weight: 700;">%s</span>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #333;">%d</td>
                                </tr>
                            """,
                    color, status, count));
        });

        if (statusCounts.isEmpty()) {
            statusBreakdownHtml.append(
                    "<tr><td colspan='2' style='padding:20px; text-align:center; color:#999;'>No orders placed today.</td></tr>");
        }

        // 4. Peak Hour Calculation
        Map<Integer, Integer> hourCounts = new java.util.HashMap<>();
        for (com.campobite.smartcanteen.backend.order.Order o : allOrdersToday) {
            int h = o.getCreatedAt().getHour();
            hourCounts.put(h, hourCounts.getOrDefault(h, 0) + 1);
        }
        String peakHour = "-";
        int maxCount = 0;
        for (Map.Entry<Integer, Integer> entry : hourCounts.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                peakHour = String.format("%02d:00 - %02d:00", entry.getKey(), entry.getKey() + 1);
            }
        }

        // 5. Avg Wait Time (Completed Orders)
        List<com.campobite.smartcanteen.backend.order.Order> completedOrders = orderRepo
                .findByStatusAndCompletedAtBetween("COMPLETED", start, end);
        double totalWait = 0;
        int count = 0;
        for (com.campobite.smartcanteen.backend.order.Order o : completedOrders) {
            if (o.getCreatedAt() != null && o.getCompletedAt() != null) {
                long diff = Duration.between(o.getCreatedAt(), o.getCompletedAt()).toMinutes();
                totalWait += diff;
                count++;
            }
        }
        double avgWaitTime = count > 0 ? totalWait / count : 0;

        // 6. Top Selling Items
        List<Object[]> topItems = orderItemRepo.findTopSellingItems(PageRequest.of(0, 5));
        StringBuilder topItemsHtml = new StringBuilder();
        if (topItems.isEmpty()) {
            topItemsHtml.append(
                    "<tr><td colspan='2' style='padding:15px; text-align:center; color:#94a3b8; font-size:12px;'>No sales yet</td></tr>");
        } else {
            for (Object[] row : topItems) {
                MenuItem item = (MenuItem) row[0];
                Long sold = (Long) row[1];
                topItemsHtml.append(String.format(
                        """
                                   <tr>
                                       <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 13px; font-weight: 500;">%s</td>
                                       <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #1e293b; font-weight: 700; font-size: 13px;">%d</td>
                                   </tr>
                                """,
                        item.getName(), sold));
            }
        }

        // Send Email
        emailService.sendDailyReport(adminEmail, reportDate, totalOrders, totalRevenue, statusBreakdownHtml.toString(),
                peakHour, avgWaitTime, topItemsHtml.toString());
        System.out.println("Daily Report sent to " + adminEmail);
    }

    private String getStatusColor(String status) {
        switch (status) {
            case "PENDING":
                return "#f59e0b"; // Orange
            case "CONFIRMED":
                return "#3b82f6"; // Blue
            case "PREPARING":
                return "#8b5cf6"; // Purple
            case "READY":
                return "#10b981"; // Green
            case "COMPLETED":
                return "#059669"; // Dark Green
            case "CANCELLED":
                return "#ef4444"; // Red
            default:
                return "#64748b"; // Grey
        }
    }
}
