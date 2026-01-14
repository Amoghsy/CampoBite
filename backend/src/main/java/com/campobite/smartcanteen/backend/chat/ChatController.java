package com.campobite.smartcanteen.backend.chat;

import com.campobite.smartcanteen.backend.chat.dto.ChatRequest;
import com.campobite.smartcanteen.backend.chat.dto.ChatResponse;
import com.campobite.smartcanteen.backend.chat.dto.UserQueryRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request, Authentication authentication) {
        String userEmail = (authentication != null) ? authentication.getName() : null;
        return chatService.processMessage(request, userEmail);
    }

    @PostMapping("/query")
    public Long submitQuery(@RequestBody UserQueryRequest request, Authentication authentication) {
        String userEmail = (authentication != null) ? authentication.getName() : "Anonymous";
        return chatService.submitQuery(userEmail, request.getQuery()).getId();
    }

    @GetMapping("/query/{id}")
    public UserQuery getQuery(@PathVariable Long id) {
        return chatService.getQuery(id);
    }
}
