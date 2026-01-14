package com.campobite.smartcanteen.backend.chat;

import org.springframework.stereotype.Component;

@Component
public class ChatIntentDetector {

    public ChatIntent detect(String message) {
        if (message == null)
            return ChatIntent.UNKNOWN;

        String msg = message.toLowerCase();

        if (msg.contains("hello") || msg.contains("hi") || msg.contains("hey")) {
            return ChatIntent.GREETING;
        }

        if (msg.contains("order") || msg.contains("status") || msg.contains("track")
                || msg.contains("where is my food")) {
            return ChatIntent.ORDER_STATUS;
        }

        if (msg.contains("menu") || msg.contains("food") || msg.contains("available") || msg.contains("price")) {
            return ChatIntent.MENU_QUERY;
        }

        if (msg.contains("token") || msg.contains("queue") || msg.contains("number")) {
            return ChatIntent.TOKEN_QUERY;
        }

        if (msg.contains("recommend") || msg.contains("suggest") || msg.contains("best") || msg.contains("popular")) {
            return ChatIntent.RECOMMENDATION;
        }

        return ChatIntent.UNKNOWN;
    }
}
