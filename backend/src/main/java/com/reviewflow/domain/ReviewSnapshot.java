package com.reviewflow.domain;
import jakarta.persistence.*; import java.time.LocalDate; import java.util.UUID;
@Entity @Table(name="review_snapshots") public class ReviewSnapshot { @Id @GeneratedValue(strategy=GenerationType.UUID) public UUID id; @Column(nullable=false,name="business_id") public UUID businessId; @Column(nullable=false, columnDefinition="numeric(2,1)") public double rating; @Column(nullable=false,name="total_reviews") public int totalReviews; @Column(nullable=false,name="snapshot_date") public LocalDate snapshotDate; @Column(nullable=false) public String source; }
