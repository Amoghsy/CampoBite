package com.campobite.smartcanteen.backend.notification;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(
            String toEmail,
            String customerName,
            int tokenNumber,
            double totalAmount,
            java.util.List<com.campobite.smartcanteen.backend.order.OrderItem> items) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true);

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

    public void sendQueryReply(String toEmail, String query, String reply) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true);

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
}
