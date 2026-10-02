package com.reviewflow.repo;
import com.reviewflow.domain.User; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface UserRepository extends JpaRepository<User,UUID>{Optional<User> findByEmailIgnoreCase(String email);}
