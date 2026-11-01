package com.temple.ledger.service;

import com.temple.ledger.domain.accounting.Account;
import com.temple.ledger.domain.accounting.JournalEntry;
import com.temple.ledger.domain.accounting.JournalPosting;
import com.temple.ledger.exception.UnbalancedJournalException;
import com.temple.ledger.repository.AccountRepository;
import com.temple.ledger.repository.JournalEntryRepository;
import com.temple.ledger.repository.JournalPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountingEngineService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalPostingRepository journalPostingRepository;

    /**
     * Creates and persists a balanced double-entry Journal Entry with postings.
     * Enforces double-entry rules:
     * - Minimum 2 postings.
     * - Total debits == Total credits.
     * - Total debit > 0.
     * - Valid active accounts for each leg.
     */
    @Transactional
    public JournalEntry createBalancedJournalEntry(
            LocalDate entryDate,
            String description,
            String referenceType,
            UUID referenceId,
            String createdBy,
            List<PostingItem> postings
    ) {
        Objects.requireNonNull(entryDate, "Entry date cannot be null");
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description cannot be null or empty");
        }
        if (referenceType == null || referenceType.isBlank()) {
            throw new IllegalArgumentException("Reference type cannot be null or empty");
        }
        if (createdBy == null || createdBy.isBlank()) {
            throw new IllegalArgumentException("Created by cannot be null or empty");
        }
        if (postings == null || postings.size() < 2) {
            throw new IllegalArgumentException("A journal entry requires at least two postings");
        }

        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        List<PostingAccountPair> resolvedPostings = new ArrayList<>();

        for (PostingItem item : postings) {
            if (item.accountId() == null) {
                throw new IllegalArgumentException("Posting item must specify an accountId");
            }

            Account account = accountRepository.findById(item.accountId())
                    .orElseThrow(() -> new IllegalArgumentException("Account not found with ID: " + item.accountId()));

            if (!account.isActive()) {
                throw new IllegalStateException("Cannot post transaction to inactive account: " + account.getCode());
            }

            BigDecimal debit = item.debitAmount() != null ? item.debitAmount() : BigDecimal.ZERO;
            BigDecimal credit = item.creditAmount() != null ? item.creditAmount() : BigDecimal.ZERO;

            if (debit.compareTo(BigDecimal.ZERO) < 0 || credit.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Debit and credit amounts cannot be negative");
            }

            boolean isDebit = debit.compareTo(BigDecimal.ZERO) > 0 && credit.compareTo(BigDecimal.ZERO) == 0;
            boolean isCredit = credit.compareTo(BigDecimal.ZERO) > 0 && debit.compareTo(BigDecimal.ZERO) == 0;

            if (!isDebit && !isCredit) {
                throw new IllegalArgumentException("Each posting line must have an amount greater than zero on either debit or credit, not both");
            }

            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);

            resolvedPostings.add(new PostingAccountPair(account, debit, credit));
        }

        if (totalDebit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Total debit amount must be greater than zero");
        }

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException(totalDebit, totalCredit);
        }

        String entryNumber = generateUniqueEntryNumber(entryDate);

        JournalEntry journalEntry = JournalEntry.builder()
                .entryNumber(entryNumber)
                .entryDate(entryDate)
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .createdBy(createdBy)
                .build();

        for (PostingAccountPair pair : resolvedPostings) {
            JournalPosting posting = JournalPosting.builder()
                    .journalEntry(journalEntry)
                    .account(pair.account)
                    .debitAmount(pair.debit)
                    .creditAmount(pair.credit)
                    .build();
            journalEntry.addPosting(posting);
        }

        return journalEntryRepository.save(journalEntry);
    }

    /**
     * Calculates current balance for the given account ID based on normal balance convention:
     * - ASSET & EXPENSE: normal balance = debits - credits
     * - LIABILITY, EQUITY & INCOME: normal balance = credits - debits
     */
    @Transactional(readOnly = true)
    public BigDecimal getAccountBalance(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with ID: " + accountId));
        return computeBalance(account);
    }

    /**
     * Calculates current balance for the given account code.
     */
    @Transactional(readOnly = true)
    public BigDecimal getAccountBalanceByCode(String code) {
        Account account = accountRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with code: " + code));
        return computeBalance(account);
    }

    private BigDecimal computeBalance(Account account) {
        BigDecimal totalDebits = journalPostingRepository.sumDebitsByAccountId(account.getId());
        BigDecimal totalCredits = journalPostingRepository.sumCreditsByAccountId(account.getId());

        if (totalDebits == null) {
            totalDebits = BigDecimal.ZERO;
        }
        if (totalCredits == null) {
            totalCredits = BigDecimal.ZERO;
        }

        if (account.getType().isDebitNormal()) {
            return totalDebits.subtract(totalCredits);
        } else {
            return totalCredits.subtract(totalDebits);
        }
    }

    private synchronized String generateUniqueEntryNumber(LocalDate entryDate) {
        int year = entryDate.getYear();
        String prefix = String.format("JE-%d-", year);
        long count = journalEntryRepository.countByEntryNumberStartingWith(prefix);
        long seq = count + 1;
        String entryNumber = String.format("JE-%d-%05d", year, seq);

        while (journalEntryRepository.existsByEntryNumber(entryNumber)) {
            seq++;
            entryNumber = String.format("JE-%d-%05d", year, seq);
        }
        return entryNumber;
    }

    private record PostingAccountPair(Account account, BigDecimal debit, BigDecimal credit) {}
}
