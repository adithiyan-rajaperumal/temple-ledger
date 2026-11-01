package com.temple.ledger.repository;

import com.temple.ledger.domain.outflow.Expense;
import com.temple.ledger.domain.outflow.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Optional<Expense> findByVoucherNo(String voucherNo);

    boolean existsByVoucherNo(String voucherNo);

    long countByVoucherNoStartingWith(String prefix);

    List<Expense> findByContractorId(UUID contractorId);

    List<Expense> findByCategory(ExpenseCategory category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.contractor.id = :contractorId")
    BigDecimal sumAmountByContractorId(@Param("contractorId") UUID contractorId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.category = :category")
    BigDecimal sumAmountByCategory(@Param("category") ExpenseCategory category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e")
    BigDecimal sumTotalExpenses();
}
