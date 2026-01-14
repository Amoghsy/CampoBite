package com.campobite.smartcanteen.backend.menu;

import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

import com.campobite.smartcanteen.backend.user.UserRepository;
import com.campobite.smartcanteen.backend.user.User;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/api/admin/menu")
public class MenuController {

    private final MenuRepository menuRepository;
    private final com.campobite.smartcanteen.backend.order.OrderItemRepository orderItemRepo;
    private final UserRepository userRepository;

    public MenuController(
            MenuRepository menuRepository,
            com.campobite.smartcanteen.backend.order.OrderItemRepository orderItemRepo,
            UserRepository userRepository) {
        this.menuRepository = menuRepository;
        this.orderItemRepo = orderItemRepo;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<MenuItem> getMenu() {
        return menuRepository.findAll();
    }

    @PostMapping
    public MenuItem addMenuItem(@RequestBody MenuItem menuItem) {
        return menuRepository.save(menuItem);
    }

    @PutMapping("/{id}")
    public MenuItem updateMenuItem(@PathVariable Long id, @RequestBody MenuItem menuItem) {
        menuItem.setId(id);
        return menuRepository.save(menuItem);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteMenuItem(@PathVariable Long id) {
        // Force delete: clear history first
        orderItemRepo.deleteByMenuItemId(id);
        menuRepository.deleteById(id);
    }

    @GetMapping("/recommended")
    public List<MenuItem> getRecommended(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return menuRepository.findAll().stream().limit(3).toList();
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return menuRepository.findAll().stream().limit(3).toList();
        }

        List<MenuItem> recommended = menuRepository.findTopOrderedItemsByUserId(user.getId(), PageRequest.of(0, 5));

        if (recommended.isEmpty()) {
            return menuRepository.findAll().stream().limit(5).toList();
        }
        return recommended;
    }
}
