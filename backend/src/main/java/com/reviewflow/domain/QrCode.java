package com.reviewflow.domain;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="qr_codes") public class QrCode { @Id @GeneratedValue(strategy=GenerationType.UUID) public UUID id; @Column(nullable=false,name="business_id") public UUID businessId; @Column(nullable=false,unique=true) public String trackingSlug; @Column(nullable=false) public boolean active=true; @Column(name="created_at") public Instant createdAt=Instant.now(); }
