package com.campobite.smartcanteen.backend.chat.dto;

/**
 * Enriched chat response returned to the client.
 * Includes the reply text, detected intent, confidence score, and data source.
 */
public class ChatResponse {

    private String reply;
    private String intent;
    private double confidence;
    private String source; // "DATABASE" or "AI"

    // Optional action and metadata for client-side flows (e.g. opening Razorpay)
    // action can be "OPEN_CHECKOUT" for chat-based order placement.
    private String action;
    private Long menuItemId;
    private Integer quantity;
    /** Total amount in whole rupees (not paise). */
    private Integer amount;
    private String itemName;

    public ChatResponse() {
    }

    public ChatResponse(String reply, String intent, double confidence, String source) {
        this.reply = reply;
        this.intent = intent;
        this.confidence = confidence;
        this.source = source;
    }

    // Legacy constructor for backward compatibility with existing code
    public ChatResponse(String reply, String intent) {
        this.reply = reply;
        this.intent = intent;
        this.confidence = 1.0;
        this.source = "DATABASE";
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }
}
