package com.campobite.smartcanteen.backend.order;

import com.campobite.smartcanteen.backend.menu.MenuItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "order_items")
@Getter
@Setter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Order order;

    @ManyToOne
    private MenuItem menuItem;

    private Integer quantity;
    private Integer priceAtOrder;
}
