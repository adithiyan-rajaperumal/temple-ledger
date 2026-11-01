package com.temple.ledger.service;

import com.temple.ledger.domain.accounting.Account;

import java.math.BigDecimal;
import java.util.UUID;

public record PostingItem(
        UUID accountId,
        BigDecimal debitAmount,
        BigDecimal creditAmount
) {
    public PostingItem {
        if (debitAmount == null) {
            debitAmount = BigDecimal.ZERO;
        }
        if (creditAmount == null) {
            creditAmount = BigDecimal.ZERO;
        }
    }

    public PostingItem(Account account, BigDecimal debitAmount, BigDecimal creditAmount) {
        this(account != null ? account.getId() : null, debitAmount, creditAmount);
    }

    public static PostingItem debit(UUID accountId, BigDecimal amount) {
        return new PostingItem(accountId, amount, BigDecimal.ZERO);
    }

    public static PostingItem debit(Account account, BigDecimal amount) {
        return new PostingItem(account != null ? account.getId() : null, amount, BigDecimal.ZERO);
    }

    public static PostingItem credit(UUID accountId, BigDecimal amount) {
        return new PostingItem(accountId, BigDecimal.ZERO, amount);
    }

    public static PostingItem credit(Account account, BigDecimal amount) {
        return new PostingItem(account != null ? account.getId() : null, BigDecimal.ZERO, amount);
    }
}
