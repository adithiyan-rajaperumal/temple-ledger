package com.temple.ledger.repository;

import com.temple.ledger.domain.community.Drive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriveRepository extends JpaRepository<Drive, UUID> {
    Optional<Drive> findByCode(String code);
}
