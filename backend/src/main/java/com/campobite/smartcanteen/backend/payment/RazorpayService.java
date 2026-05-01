package com.campobite.smartcanteen.backend.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    public Order createOrder(int amount) throws Exception {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        JSONObject options = new JSONObject();
        options.put("amount", amount * 100); // INR paise
        options.put("currency", "INR");
        options.put("receipt", "txn_" + System.currentTimeMillis());

        return client.orders.create(options);
    }

    /**
     * Initiate a full refund for a captured payment.
     *
     * @param paymentId   Razorpay payment ID (e.g. pay_ABC123)
     * @param amountPaise Amount to refund in paise (e.g. 10000 = ₹100)
     * @return Refund ID from Razorpay
     */
    public String refundPayment(String paymentId, int amountPaise) throws Exception {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        JSONObject refundRequest = new JSONObject();
        refundRequest.put("amount", amountPaise);
        refundRequest.put("speed", "normal");

        com.razorpay.Refund refund = client.payments.refund(paymentId, refundRequest);
        return refund.get("id").toString();
    }
}
