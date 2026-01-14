package com.campobite.smartcanteen.backend.payment;

import com.razorpay.Order;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:8081")
public class PaymentController {

    private final RazorpayService razorpayService;

    public PaymentController(RazorpayService razorpayService) {
        this.razorpayService = razorpayService;
    }

    @PostMapping("/create-order")
    public Map<String, Object> createOrder(@RequestBody Map<String, Integer> body)
            throws Exception {

        int amount = body.get("amount");
        Order order = razorpayService.createOrder(amount);

        return Map.of(
                "orderId", order.get("id"),
                "amount", order.get("amount"),
                "currency", order.get("currency"));
    }
}
