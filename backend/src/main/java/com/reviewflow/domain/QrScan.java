package com.reviewflow.domain;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="qr_scans") public class QrScan { @Id @GeneratedValue(strategy=GenerationType.UUID) public UUID id; @Column(nullable=false,name="qr_code_id") public UUID qrCodeId; @Column(nullable=false,name="scanned_at") public Instant scannedAt=Instant.now(); @Column(name="device_type") public String deviceType; public String browser; public String country; }
