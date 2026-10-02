package com.reviewflow.repo;
import com.reviewflow.domain.QrCode; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface QrCodeRepository extends JpaRepository<QrCode,UUID>{Optional<QrCode> findByTrackingSlugAndActiveTrue(String slug); Optional<QrCode> findFirstByBusinessIdAndActiveTrue(UUID id);}
