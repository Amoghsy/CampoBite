package com.campobite.smartcanteen.backend.menu;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/inventory")
public class InventoryController {

    private final MenuRepository menuRepository;

    public InventoryController(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    /* ================= GET ALL ITEMS WITH INVENTORY INFO ================= */
    @GetMapping
    public List<MenuItem> getInventory() {
        return menuRepository.findAll();
    }

    /*
     * ================= UPDATE A SINGLE ITEM'S INVENTORY SETTINGS =================
     */
    @PutMapping("/{id}")
    public MenuItem updateInventory(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        MenuItem item = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));

        if (body.containsKey("unlimited")) {
            item.setUnlimited((Boolean) body.get("unlimited"));
        }

        if (body.containsKey("dailyLimit")) {
            Object dl = body.get("dailyLimit");
            Integer limit = dl == null ? null : ((Number) dl).intValue();
            item.setDailyLimit(limit);
            // Reset remaining to the new daily limit
            item.setRemainingQuantity(limit);
            // Auto-toggle availability based on stock level
            if (limit != null && limit > 0) {
                item.setAvailable(true);
            } else if (limit != null && limit <= 0) {
                item.setAvailable(false);
            }
        }

        // If switching to unlimited, clear limit fields
        if (Boolean.TRUE.equals(item.getUnlimited())) {
            item.setDailyLimit(null);
            item.setRemainingQuantity(null);
            if (!Boolean.TRUE.equals(item.getAvailable())) {
                item.setAvailable(true); // re-enable if it was auto-disabled
            }
        }

        return menuRepository.save(item);
    }

    /* ================= MANUAL DAILY RESET ================= */
    @PostMapping("/reset")
    public Map<String, String> resetInventory() {
        List<MenuItem> items = menuRepository.findAll();
        for (MenuItem item : items) {
            if (!Boolean.TRUE.equals(item.getUnlimited())) {
                item.setRemainingQuantity(item.getDailyLimit());
                item.setAvailable(true); // re-enable out-of-stock items
            }
        }
        menuRepository.saveAll(items);
        return Map.of("message", "Inventory reset successfully");
    }
}
