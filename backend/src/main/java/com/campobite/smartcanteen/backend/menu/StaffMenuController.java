package com.campobite.smartcanteen.backend.menu;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/menu")
public class StaffMenuController {

    private final MenuRepository menuRepository;

    public StaffMenuController(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    /* ========== GET ALL MENU ITEMS ========== */
    @GetMapping
    public List<MenuItem> getMenu() {
        return menuRepository.findAll();
    }

    /* ========== TOGGLE AVAILABILITY ========== */
    @PutMapping("/{id}/availability")
    public ResponseEntity<?> toggleAvailability(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {

        MenuItem item = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));

        Boolean available = body.get("available");
        if (available != null) {
            item.setAvailable(available);
        }

        return ResponseEntity.ok(menuRepository.save(item));
    }
}
