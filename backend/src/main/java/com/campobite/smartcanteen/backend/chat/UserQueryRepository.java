package com.campobite.smartcanteen.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserQueryRepository extends JpaRepository<UserQuery, Long> {
    List<UserQuery> findByIsRepliedFalseOrderByCreatedAtDesc();

    List<UserQuery> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    List<UserQuery> findAllByOrderByCreatedAtDesc();
}
