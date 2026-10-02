package com.reviewflow.repo;
import com.reviewflow.domain.Business; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface BusinessRepository extends JpaRepository<Business,UUID>{Optional<Business> findBySlug(String slug); Optional<Business> findFirstByUserId(UUID userId);}
