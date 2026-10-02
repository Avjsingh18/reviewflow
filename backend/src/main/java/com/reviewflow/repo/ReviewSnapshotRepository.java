package com.reviewflow.repo;
import com.reviewflow.domain.ReviewSnapshot; import org.springframework.data.jpa.repository.JpaRepository; import java.time.*; import java.util.*;
public interface ReviewSnapshotRepository extends JpaRepository<ReviewSnapshot,UUID>{List<ReviewSnapshot> findByBusinessIdAndSnapshotDateBetweenOrderBySnapshotDate(UUID id,LocalDate start,LocalDate end); Optional<ReviewSnapshot> findFirstByBusinessIdAndSnapshotDateLessThanEqualOrderBySnapshotDateDesc(UUID id,LocalDate date);}
