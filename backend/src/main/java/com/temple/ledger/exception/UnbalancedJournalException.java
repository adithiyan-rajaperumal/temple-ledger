package com.temple.ledger.exception;

import java.math.BigDecimal;

public class UnbalancedJournalException extends RuntimeException {

    private final BigDecimal totalDebit;
    private final BigDecimal totalCredit;

    public UnbalancedJournalException(BigDecimal totalDebit, BigDecimal totalCredit) {
        super(String.format("Unbalanced journal entry: total debits (%s) do not equal total credits (%s)",
                totalDebit != null ? totalDebit.toPlainString() : "0.00",
                totalCredit != null ? totalCredit.toPlainString() : "0.00"));
        this.totalDebit = totalDebit;
        this.totalCredit = totalCredit;
    }

    public UnbalancedJournalException(String message) {
        super(message);
        this.totalDebit = null;
        this.totalCredit = null;
    }

    public BigDecimal getTotalDebit() {
        return totalDebit;
    }

    public BigDecimal getTotalCredit() {
        return totalCredit;
    }
}
