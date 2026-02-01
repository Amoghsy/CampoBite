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

    @Async
    public void subscribeToTopic(String token, String topic) {
        try {
            com.google.firebase.messaging.TopicManagementResponse response = FirebaseMessaging.getInstance()
                    .subscribeToTopic(java.util.Collections.singletonList(token), topic);
            System.out.println("✅ Subscribed to topic: " + topic + " | Success: " + response.getSuccessCount());
        } catch (Exception e) {
            System.err.println("❌ Failed to subscribe to topic: " + topic);
            e.printStackTrace();
        }
    }

    @Async
    public void sendTopicNotification(String topic, String title, String body, java.util.Map<String, String> data) {
        try {
            Message.Builder messageBuilder = Message.builder()
                    .setTopic(topic)
                    .putData("title", title)
                    .putData("body", body);

            if (data != null) {
                messageBuilder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            System.out.println("🔥 FCM Topic (" + topic + ") Sent: " + response);
        } catch (Exception e) {
            System.err.println("❌ FCM Topic Failed: " + topic);
            e.printStackTrace();
        }
    }
}
