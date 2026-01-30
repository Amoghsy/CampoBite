package com.campobite.smartcanteen.backend.notification;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendOrderConfirmation(
            String toEmail,
            String customerName,
            int tokenNumber,
            double totalAmount,
            java.util.List<com.campobite.smartcanteen.backend.order.OrderItem> items) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom("amoghsys891@gmail.com");
            helper.setSubject("🍽️ CampoBite Order Confirmed #" + tokenNumber);

            StringBuilder itemsHtml = new StringBuilder();
            for (com.campobite.smartcanteen.backend.order.OrderItem item : items) {
                itemsHtml.append("<tr>")
                        .append("<td style='padding: 12px; border-bottom: 1px solid #edf2f7; color: #555;'>")
                        .append(item.getMenuItem().getName()).append("</td>")
                        .append("<td style='padding: 12px; border-bottom: 1px solid #edf2f7; text-align: center; color: #555;'>")
                        .append(item.getQuantity()).append("</td>")
                        .append("<td style='padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; color: #555;'>₹")
                        .append(item.getPriceAtOrder()).append("</td>")
                        .append("<td style='padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; font-weight: 600; color: #333;'>₹")
                        .append(item.getPriceAtOrder() * item.getQuantity()).append("</td>")
                        .append("</tr>");
            }

            String htmlContent = """
                    <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8;">
                        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                            <!-- Header with Gradient -->
                            <div style="background: linear-gradient(135deg, #27b08b 0%%, #13907b 100%%); padding: 30px 20px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 28px; font-weight: 700;">CampoBite</h1>
                                <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Smart Canteen Ordering</p>
                            </div>

                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Hi <strong>%s</strong>,</p>
                                <p style="color: #666;">Your order has been successfully placed! Here is your digital receipt.</p>

                                <!-- Token Box -->
                                <div style="background-color: #eafcf6; border: 1px solid #c9eee5; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                                    <h2 style="margin: 0; color: #13907b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Token Number</h2>
                                    <h1 style="margin: 10px 0; color: #27b08b; font-size: 56px; line-height: 1; font-weight: 800;">%d</h1>
                                    <p style="margin: 0; font-size: 13px; color: #5aa693;">Please show this token at the counter.</p>
                                </div>

                                <table style="width: 100%%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px;">
                                    <thead>
                                        <tr style="background-color: #f8fafc;">
                                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #555; border-bottom: 2px solid #edf2f7;">Item</th>
                                            <th style="padding: 12px; text-align: center; font-weight: 600; color: #555; border-bottom: 2px solid #edf2f7;">Qty</th>
                                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #555; border-bottom: 2px solid #edf2f7;">Price</th>
                                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #555; border-bottom: 2px solid #edf2f7;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        %s
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: 700; color: #333; border-top: 2px solid #edf2f7;">Total Amount</td>
                                            <td style="padding: 15px 12px; text-align: right; font-weight: 700; color: #27b08b; font-size: 18px; border-top: 2px solid #edf2f7;">₹%.2f</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
                                    <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Thank you for ordering with CampoBite! 😊</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(customerName, tokenNumber, itemsHtml.toString(), totalAmount);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace(); // Log error but don't stop flow
        }
    }

    @Async
    public void sendQueryReply(String toEmail, String query, String reply) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom("amoghsys891@gmail.com");
            helper.setSubject("Re: Your Query - CampoBite");

            String htmlContent = """
                    <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8;">
                        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                            <div style="background: linear-gradient(135deg, #27b08b 0%%, #13907b 100%%); padding: 30px 20px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 24px;">CampoBite Support</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p>Hello,</p>
                                <p>You asked:</p>
                                <blockquote style="background: #f9f9f9; border-left: 4px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px; font-style: italic;">
                                    "%s"
                                </blockquote>
                                <p><strong>Admin Reply:</strong></p>
                                <div style="background-color: #eafcf6; border: 1px solid #c9eee5; border-radius: 8px; padding: 15px; color: #333;">
                                    %s
                                </div>
                                <p style="margin-top: 20px; font-size: 12px; color: #999;">If you have further questions, feel free to contact us again.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(query, reply);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Async
    public void sendOtpEmail(String toEmail, String name, int tokenNumber, String otp) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom("amoghsys891@gmail.com");
            helper.setSubject("🔐 Order Pickup OTP - CampoBite");

            String htmlContent = """
                    <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8;">
                        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                            <div style="background: linear-gradient(135deg, #27b08b 0%%, #13907b 100%%); padding: 30px 20px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 24px;">Order Ready for Pickup!</h1>
                            </div>
                            <div style="padding: 30px; text-align: center;">
                                <p>Hi <strong>%s</strong>,</p>
                                <p>Your order #%d is ready! Please show this OTP at the counter to collect your food.</p>

                                <div style="background-color: #eafcf6; border: 1px solid #c9eee5; border-radius: 12px; padding: 20px; margin: 25px 0;">
                                    <h2 style="margin: 0; color: #13907b; font-size: 14px; text-transform: uppercase;">Your OTP</h2>
                                    <h1 style="margin: 10px 0; color: #27b08b; font-size: 48px; letter-spacing: 5px; font-weight: 800;">%s</h1>
                                    <p style="margin: 0; font-size: 12px; color: #cc5555;">Valid for 5 minutes only</p>
                                </div>

                                <p style="font-size: 12px; color: #999;">Do not share this OTP with anyone else.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(name, tokenNumber, otp);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Async
    public void sendDailyReport(String toEmail, String reportDate, long totalOrders, double totalRevenue,
            String statusBreakdown, String peakHour, double avgWaitTime, String topItemsHtml) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom("amoghsys891@gmail.com");
            helper.setSubject("📊 Daily Analytics Report - " + reportDate);

            String htmlContent = """
                    <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8; margin: 0; padding: 0;">
                        <div style="max-width: 640px; margin: 20px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">

                            <!-- Header with Gradient and Logo -->
                            <div style="background: linear-gradient(135deg, #27b08b 0%%, #13907b 100%%); padding: 40px 30px; text-align: center; color: white;">
                                <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px;">
                                    📊
                                </div>
                                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Daily Business Report</h1>
                                <p style="margin: 5px 0 0; font-size: 15px; opacity: 0.9; font-weight: 500;">%s</p>
                            </div>

                            <div style="padding: 40px 30px;">

                                <!-- Key Metrics Grid -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                    <!-- Revenue Card -->
                                    <div style="grid-column: span 2; padding: 20px; border-radius: 20px; background: linear-gradient(145deg, #ecfdf5 0%%, #d1fae5 100%%); text-align: center; border: 1px solid #a7f3d0;">
                                        <div style="font-size: 13px; color: #047857; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Total Revenue</div>
                                        <div style="font-size: 36px; color: #065f46; font-weight: 900;">₹%.2f</div>
                                    </div>

                                    <!-- Orders Card -->
                                    <div style="padding: 15px; border-radius: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; text-align: center;">
                                        <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Orders</div>
                                        <div style="font-size: 24px; color: #1e293b; font-weight: 800; margin-top: 2px;">%d</div>
                                    </div>

                                    <!-- Wait Time Card -->
                                    <div style="padding: 15px; border-radius: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; text-align: center;">
                                        <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Avg Wait Time</div>
                                        <div style="font-size: 24px; color: #1e293b; font-weight: 800; margin-top: 2px;">%.0f min</div>
                                    </div>

                                    <!-- Peak Hour Card -->
                                    <div style="grid-column: span 2; padding: 15px; border-radius: 16px; background-color: #fff7ed; border: 1px solid #ffedd5; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                        <div style="font-size: 12px; color: #c2410c; font-weight: 700; text-transform: uppercase;">🔥 Busiest Hour:</div>
                                        <div style="font-size: 20px; color: #9a3412; font-weight: 800;">%s</div>
                                    </div>
                                </div>

                                <!-- Order Status Section -->
                                <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                                    <span style="width: 4px; height: 16px; background-color: #27b08b; border-radius: 4px; display: inline-block;"></span>
                                    Order Status Breakdown
                                </h3>
                                <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 5px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                                    <table style="width: 100%%; border-collapse: Separate; border-spacing: 0;">
                                        <thead style="background-color: #f8fafc;">
                                            <tr>
                                                <th style="padding: 12px 15px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; border-top-left-radius: 12px;">Status</th>
                                                <th style="padding: 12px 15px; text-align: right; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; border-top-right-radius: 12px;">Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            %s
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Top Items Section -->
                                <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                                    <span style="width: 4px; height: 16px; background-color: #27b08b; border-radius: 4px; display: inline-block;"></span>
                                    Top Selling Items
                                </h3>
                                <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 5px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                                    <table style="width: 100%%; border-collapse: separate; border-spacing: 0;">
                                        <thead style="background-color: #f8fafc;">
                                            <tr>
                                                <th style="padding: 12px 15px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; border-top-left-radius: 12px;">Item Name</th>
                                                <th style="padding: 12px 15px; text-align: right; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; border-top-right-radius: 12px;">Qty Sold</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            %s
                                        </tbody>
                                    </table>
                                </div>

                                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                                        Sent automatically by <strong>CampoBite Admin System</strong><br>
                                        Date: %s
                                    </p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(reportDate, totalRevenue, totalOrders, avgWaitTime, peakHour, statusBreakdown,
                            topItemsHtml, reportDate);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
