package com.campobite.smartcanteen.backend.chat;

import com.campobite.smartcanteen.backend.chat.dto.UserQueryReplyRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/queries")
public class AdminQueryController {

    private final ChatService chatService;

    public AdminQueryController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<UserQuery> getAllQueries() {
        return chatService.getAllQueries();
    }

    @PostMapping("/{id}/reply")
    public void replyToQuery(@PathVariable Long id, @RequestBody UserQueryReplyRequest request) {
        chatService.replyToQuery(id, request.getReply());
    }
}
