package com.campobite.smartcanteen.backend.payment;

import com.campobite.smartcanteen.backend.order.OrderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import org.json.JSONObject;

@RestController
@RequestMapping("/api/payment")
public class RazorpayWebhookController {

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    private final OrderRepository orderRepository;

    public RazorpayWebhookController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Razorpay calls this URL server-to-server after a payment event.
     * Security: we verify the HMAC-SHA256 signature before processing.
     *
     * To set up:
     * 1. Razorpay Dashboard → Settings → Webhooks → Add Webhook
     * 2. URL: https://<your-domain>/api/payment/webhook
     * 3. Events: payment.captured, payment.failed
     * 4. Copy secret → set razorpay.webhook.secret in application.properties
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        // 1. Read raw request body
        String rawBody;
        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            rawBody = sb.toString();
        } catch (Exception e) {
            System.err.println("[WEBHOOK] Failed to read request body: " + e.getMessage());
            return ResponseEntity.badRequest().body("Bad request");
        }

        // 2. Verify signature
        if (signature == null || signature.isBlank()) {
            System.err.println("[WEBHOOK] Missing X-Razorpay-Signature header");
            return ResponseEntity.status(400).body("Missing signature");
        }

        if (!isValidSignature(rawBody, signature)) {
            System.err.println("[WEBHOOK] ⚠️ Signature mismatch — possible tampered request");
            return ResponseEntity.status(400).body("Invalid signature");
        }

        // 3. Parse event
        try {
            JSONObject payload = new JSONObject(rawBody);
            String event = payload.optString("event", "");

            System.out.println("[WEBHOOK] ✅ Verified event: " + event);

            switch (event) {
                case "payment.captured" -> handlePaymentCaptured(payload);
                case "payment.failed" -> handlePaymentFailed(payload);
                default -> System.out.println("[WEBHOOK] Unhandled event: " + event);
            }

        } catch (Exception e) {
            System.err.println("[WEBHOOK] Error parsing payload: " + e.getMessage());
            return ResponseEntity.status(500).body("Processing error");
        }

        // Razorpay expects a 200 OK to acknowledge receipt
        return ResponseEntity.ok("OK");
    }

    /* ====== EVENT HANDLERS ====== */

    private void handlePaymentCaptured(JSONObject payload) {
        try {
            JSONObject paymentEntity = payload
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String paymentId = paymentEntity.optString("id");
            String razorpayOrderId = paymentEntity.optString("order_id");
            int amountPaise = paymentEntity.optInt("amount", 0);
            String currency = paymentEntity.optString("currency", "INR");
            String method = paymentEntity.optString("method", "unknown");
            String email = paymentEntity.optString("email", "");

            System.out.printf(
                    "[WEBHOOK] 💰 payment.captured — id=%s | orderId=%s | amount=%.2f %s | method=%s | email=%s%n",
                    paymentId, razorpayOrderId, amountPaise / 100.0, currency, method, email);

            // ✅ Look up CampoBite order and update payment status
            orderRepository.findByRazorpayOrderId(razorpayOrderId).ifPresentOrElse(
                    order -> {
                        order.setRazorpayPaymentId(paymentId);
                        order.setPaymentStatus("CAPTURED");
                        orderRepository.save(order);
                        System.out.printf("[WEBHOOK] ✅ Order #%d updated — paymentStatus=CAPTURED, paymentId=%s%n",
                                order.getTokenNumber(), paymentId);
                    },
                    () -> System.err.println("[WEBHOOK] ⚠️ No order found for razorpayOrderId=" + razorpayOrderId));

        } catch (Exception e) {
            System.err.println("[WEBHOOK] Error handling payment.captured: " + e.getMessage());
        }
    }

    private void handlePaymentFailed(JSONObject payload) {
        try {
            JSONObject paymentEntity = payload
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String paymentId = paymentEntity.optString("id");
            String razorpayOrderId = paymentEntity.optString("order_id");
            String errorCode = paymentEntity.optString("error_code", "unknown");

            System.err.printf(
                    "[WEBHOOK] ❌ payment.failed — id=%s | orderId=%s | error=%s%n",
                    paymentId, razorpayOrderId, errorCode);

            // Mark order payment as FAILED
            orderRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(order -> {
                order.setPaymentStatus("FAILED");
                orderRepository.save(order);
                System.err.printf("[WEBHOOK] Order #%d marked FAILED%n", order.getTokenNumber());
            });

        } catch (Exception e) {
            System.err.println("[WEBHOOK] Error handling payment.failed: " + e.getMessage());
        }
    }

    /* ====== SIGNATURE VERIFICATION ====== */

    /**
     * Razorpay signature: HMAC-SHA256(webhookSecret, rawBody), hex-encoded.
     */
    private boolean isValidSignature(String rawBody, String receivedSignature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);

            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);

            return computed.equalsIgnoreCase(receivedSignature);
        } catch (Exception e) {
            System.err.println("[WEBHOOK] Signature computation failed: " + e.getMessage());
            return false;
        }
    }
}
