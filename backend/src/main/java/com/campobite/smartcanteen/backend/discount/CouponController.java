package com.campobite.smartcanteen.backend.discount;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CouponController {

    private final CouponRepository couponRepository;
    private final com.campobite.smartcanteen.backend.notification.NotificationService notificationService;

    public CouponController(CouponRepository couponRepository,
            com.campobite.smartcanteen.backend.notification.NotificationService notificationService) {
        this.couponRepository = couponRepository;
        this.notificationService = notificationService;
    }

    /* ================= ADMIN: MANAGE COUPONS ================= */

    @GetMapping("/admin/coupons")
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @PostMapping("/admin/coupons")
    public Coupon createCoupon(@RequestBody Coupon coupon) {
        if (couponRepository.existsByCode(coupon.getCode())) {
            throw new RuntimeException("Coupon code already exists");
        }
        Coupon saved = couponRepository.save(coupon);

        // Notify Users
        notificationService.sendTopicNotification(
                "coupons",
                "New Offer! 🎉",
                "Get " + saved.getDiscountPercentage() + "% OFF with code " + saved.getCode(),
                java.util.Map.of("code", saved.getCode()));

        return saved;
    }

    @PutMapping("/admin/coupons/{id}")
    public Coupon updateCoupon(@PathVariable Long id, @RequestBody Coupon details) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        coupon.setDiscountPercentage(details.getDiscountPercentage());
        coupon.setExpiryDate(details.getExpiryDate());
        coupon.setActive(details.isActive());

        return couponRepository.save(coupon);
    }

    @DeleteMapping("/admin/coupons/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /* ================= USER: VALIDATE COUPON ================= */

    @PostMapping("/coupons/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null)
            return ResponseEntity.badRequest().body("Code required");

        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElse(null);

        if (coupon == null) {
            return ResponseEntity.badRequest().body("Invalid coupon code");
        }

        if (!coupon.isActive()) {
            return ResponseEntity.badRequest().body("Coupon is inactive");
        }

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body("Coupon has expired");
        }

        return ResponseEntity.ok(coupon);
    }
}
