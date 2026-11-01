package com.temple.ledger.repository;

import com.temple.ledger.domain.accounting.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    Optional<JournalEntry> findByEntryNumber(String entryNumber);

    boolean existsByEntryNumber(String entryNumber);

    long countByEntryNumberStartingWith(String prefix);
}
