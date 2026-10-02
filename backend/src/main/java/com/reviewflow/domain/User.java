package com.reviewflow.domain;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="users") public class User { @Id @GeneratedValue(strategy=GenerationType.UUID) public UUID id; @Column(nullable=false) public String name; @Column(nullable=false,unique=true) public String email; @Column(nullable=false,name="password_hash") public String passwordHash; @Column(name="created_at") public Instant createdAt=Instant.now(); @Column(name="updated_at") public Instant updatedAt=Instant.now(); }
