package com.campobite.smartcanteen.backend.order;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    void deleteByMenuItemId(Long menuItemId);

    @org.springframework.data.jpa.repository.Query("SELECT oi.menuItem, COUNT(oi) as sold FROM OrderItem oi GROUP BY oi.menuItem ORDER BY sold DESC")
    java.util.List<Object[]> findTopSellingItems(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT oi.menuItem, COUNT(oi) as sold FROM OrderItem oi WHERE oi.order.createdAt BETWEEN :start AND :end GROUP BY oi.menuItem ORDER BY sold DESC")
    java.util.List<Object[]> findTopSellingItemsBetween(java.time.LocalDateTime start, java.time.LocalDateTime end,
            org.springframework.data.domain.Pageable pageable);
}
