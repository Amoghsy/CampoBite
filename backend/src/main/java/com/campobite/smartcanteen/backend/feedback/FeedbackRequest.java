package com.campobite.smartcanteen.backend.feedback;

public class FeedbackRequest {

    private int rating;
    private String foodQuality;
    private String deliverySpeed;
    private String comment;
    private Boolean wouldRecommend;

    public int getRating() {
        return rating;
    }

    public String getFoodQuality() {
        return foodQuality;
    }

    public String getDeliverySpeed() {
        return deliverySpeed;
    }

    public String getComment() {
        return comment;
    }

    public Boolean getWouldRecommend() {
        return wouldRecommend;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setFoodQuality(String foodQuality) {
        this.foodQuality = foodQuality;
    }

    public void setDeliverySpeed(String deliverySpeed) {
        this.deliverySpeed = deliverySpeed;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void setWouldRecommend(Boolean wouldRecommend) {
        this.wouldRecommend = wouldRecommend;
    }
}
