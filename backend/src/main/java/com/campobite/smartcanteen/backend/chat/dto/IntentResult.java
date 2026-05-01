package com.campobite.smartcanteen.backend.chat.dto;

import com.campobite.smartcanteen.backend.chat.ChatIntent;

/**
 * Holds the detected intent along with a confidence score (0.0 to 1.0).
 */
public class IntentResult {

    private final ChatIntent intent;
    private final double confidence;

    public IntentResult(ChatIntent intent, double confidence) {
        this.intent = intent;
        this.confidence = Math.min(1.0, Math.max(0.0, confidence));
    }

    public ChatIntent getIntent() {
        return intent;
    }

    public double getConfidence() {
        return confidence;
    }
}
