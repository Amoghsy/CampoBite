package com.campobite.smartcanteen.backend.notification;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Async
    public void sendOrderUpdate(String fcmToken, String status, int tokenNumber) {

        if (fcmToken == null || fcmToken.isBlank()) {
            System.out.println("❌ FCM token is null or empty. Notification not sent.");
            return;
        }

        try {
            // ✅ DATA-ONLY MESSAGE (REQUIRED FOR WEB)
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .putData("title", "Order Update 🍽️")
                    .putData(
                            "body",
                            "Your order #" + tokenNumber + " is now " + status)
                    .putData("status", status)
                    .putData("tokenNumber", String.valueOf(tokenNumber))
                    .putData("type", "ORDER_STATUS")
                    .build();

            // ✅ SEND SYNCHRONOUSLY + LOG RESULT
            String response = FirebaseMessaging.getInstance().send(message);

            System.out.println("🔥 FCM SENT SUCCESSFULLY");
            System.out.println("➡ Token: " + fcmToken);
            System.out.println("➡ Response: " + response);

        } catch (Exception e) {
            System.err.println("❌ FCM FAILED");
            e.printStackTrace();
        }
    }
}
