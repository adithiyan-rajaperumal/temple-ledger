package com.temple.ledger.repository;

import com.temple.ledger.domain.accounting.JournalPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface JournalPostingRepository extends JpaRepository<JournalPosting, UUID> {

    List<JournalPosting> findByAccountId(UUID accountId);

    @Query("SELECT COALESCE(SUM(p.debitAmount), 0) FROM JournalPosting p WHERE p.account.id = :accountId")
    BigDecimal sumDebitsByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(p.creditAmount), 0) FROM JournalPosting p WHERE p.account.id = :accountId")
    BigDecimal sumCreditsByAccountId(@Param("accountId") UUID accountId);
}
