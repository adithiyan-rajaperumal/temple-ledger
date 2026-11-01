package com.temple.ledger.repository;

import com.temple.ledger.domain.community.DriveFamilyAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriveFamilyAllocationRepository extends JpaRepository<DriveFamilyAllocation, UUID> {
    List<DriveFamilyAllocation> findByDriveId(UUID driveId);
    Optional<DriveFamilyAllocation> findByDriveIdAndFamilyId(UUID driveId, UUID familyId);
    boolean existsByDriveIdAndFamilyId(UUID driveId, UUID familyId);
}
