package com.campobite.smartcanteen.backend.menu;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuRepository extends JpaRepository<MenuItem, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT oi.menuItem FROM OrderItem oi WHERE oi.order.user.id = :userId GROUP BY oi.menuItem ORDER BY COUNT(oi) DESC")
    java.util.List<MenuItem> findTopOrderedItemsByUserId(Long userId,
            org.springframework.data.domain.Pageable pageable);
}
