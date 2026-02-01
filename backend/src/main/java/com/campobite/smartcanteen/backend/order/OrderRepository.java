package com.campobite.smartcanteen.backend.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

        Optional<Order> findFirstByUserIdAndStatusIn(
                        Long userId,
                        List<String> statuses);

        List<Order> findByUserIdAndStatusIn(
                        Long userId,
                        List<String> statuses);

        List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

        long countByStatus(String status);

        long countByStatusIn(List<String> statuses);

        long countByStatusAndCompletedAtBetween(String status, java.time.LocalDateTime start,
                        java.time.LocalDateTime end);

        @org.springframework.data.jpa.repository.Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = :status AND o.completedAt BETWEEN :start AND :end")
        Long sumTotalAmountByStatusAndCompletedAtBetween(String status, java.time.LocalDateTime start,
                        java.time.LocalDateTime end);

        List<Order> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

        List<Order> findByStatusAndCompletedAtBetween(String status, java.time.LocalDateTime start,
                        java.time.LocalDateTime end);
}
