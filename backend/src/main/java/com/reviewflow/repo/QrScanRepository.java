package com.reviewflow.repo;
import com.reviewflow.domain.QrScan; import org.springframework.data.jpa.repository.JpaRepository; import java.time.*; import java.util.*;
public interface QrScanRepository extends JpaRepository<QrScan,UUID>{long countByQrCodeIdAndScannedAtBetween(UUID qrCodeId,Instant start,Instant end); List<QrScan> findByQrCodeIdAndScannedAtBetween(UUID qrCodeId,Instant start,Instant end);}
