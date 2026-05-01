package com.campobite.smartcanteen.backend.feedback;

import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ================= RELATIONS ================= */

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    /* ================= FEEDBACK DATA ================= */

    private int rating; // 1–5

    @Column(length = 10)
    private String foodQuality; // good | average | poor

    @Column(length = 10)
    private String deliverySpeed; // fast | okay | slow

    @Column(length = 500)
    private String comment;

    private Boolean wouldRecommend;

    private LocalDateTime createdAt = LocalDateTime.now();

    /* ================= GETTERS / SETTERS ================= */

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getFoodQuality() {
        return foodQuality;
    }

    public void setFoodQuality(String foodQuality) {
        this.foodQuality = foodQuality;
    }

    public String getDeliverySpeed() {
        return deliverySpeed;
    }

    public void setDeliverySpeed(String deliverySpeed) {
        this.deliverySpeed = deliverySpeed;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Boolean getWouldRecommend() {
        return wouldRecommend;
    }

    public void setWouldRecommend(Boolean wouldRecommend) {
        this.wouldRecommend = wouldRecommend;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
