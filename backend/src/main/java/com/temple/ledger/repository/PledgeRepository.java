package com.temple.ledger.repository;

import com.temple.ledger.domain.community.Pledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PledgeRepository extends JpaRepository<Pledge, UUID> {
    Optional<Pledge> findByPledgeCode(String pledgeCode);
    List<Pledge> findByDriveId(UUID driveId);
    List<Pledge> findByFamilyId(UUID familyId);
}
