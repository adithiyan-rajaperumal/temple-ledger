package com.temple.ledger.domain.accounting;

import java.math.BigDecimal;

public class UnbalancedJournalException extends com.temple.ledger.exception.UnbalancedJournalException {

    public UnbalancedJournalException(BigDecimal totalDebit, BigDecimal totalCredit) {
        super(totalDebit, totalCredit);
    }

    public UnbalancedJournalException(String message) {
        super(message);
    }
}
