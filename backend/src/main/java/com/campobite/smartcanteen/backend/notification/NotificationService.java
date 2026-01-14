package com.campobite.smartcanteen.backend.notification;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    public void sendOrderUpdate(String fcmToken, String status, int tokenNumber) {

        Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(
                        Notification.builder()
                                .setTitle("Order Update 🍽️")
                                .setBody("Your order #" + tokenNumber + " is now " + status)
                                .build())
                .putData("status", status)
                .build();

        FirebaseMessaging.getInstance().sendAsync(message);
    }
}
