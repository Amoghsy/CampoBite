package com.campobite.smartcanteen.backend.order;

import java.util.List;

public class OrderRequest {

    private Integer totalAmount;
    private List<Item> items;

    /* ===== GETTERS ===== */
    public Integer getTotalAmount() {
        return totalAmount;
    }

    public List<Item> getItems() {
        return items;
    }

    /* ===== SETTERS ===== */
    public void setTotalAmount(Integer totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    /* ================= INNER ITEM CLASS ================= */
    public static class Item {

        private Long menuItemId;
        private Integer quantity;

        /* ===== GETTERS ===== */
        public Long getMenuItemId() {
            return menuItemId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        /* ===== SETTERS ===== */
        public void setMenuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        @Override
        public String toString() {
            return "Item{menuItemId=" + menuItemId + ", quantity=" + quantity + "}";
        }
    }

    @Override
    public String toString() {
        return "OrderRequest{totalAmount=" + totalAmount + ", items=" + items + "}";
    }
}
