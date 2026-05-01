package com.campobite.smartcanteen.backend.menu;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Integer price;
    private String category;

    private Boolean available;
    private Integer preparationTime;

    // === Inventory ===
    private Boolean unlimited = true; // if true, no stock checks
    private Integer dailyLimit; // max units per day (null if unlimited)
    private Integer remainingQuantity; // units still available today

    private String imageUrl;
}
