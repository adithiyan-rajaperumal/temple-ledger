package com.temple.ledger.repository;

import com.temple.ledger.domain.community.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyRepository extends JpaRepository<Family, UUID> {
    List<Family> findByIsActiveTrue();
    Optional<Family> findByFamilyCode(String familyCode);
    List<Family> findByHeadNameContainingIgnoreCase(String query);
}
