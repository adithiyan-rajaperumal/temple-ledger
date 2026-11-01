package com.temple.ledger.domain.accounting;

public enum AccountType {
    ASSET,
    LIABILITY,
    EQUITY,
    INCOME,
    EXPENSE;

    public boolean isDebitNormal() {
        return this == ASSET || this == EXPENSE;
    }

    public boolean isCreditNormal() {
        return this == LIABILITY || this == EQUITY || this == INCOME;
    }
}
