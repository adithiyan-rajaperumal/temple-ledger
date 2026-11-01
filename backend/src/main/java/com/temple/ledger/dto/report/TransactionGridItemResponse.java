package com.temple.ledger.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionGridItemResponse {
    private UUID id;
    private LocalDate date;
    private String flowType; // INCOME, EXPENSE, IN_KIND
    private String category;
    private String categoryTa;
    private BigDecimal amount;
    private String paymentMode; // CASH, GPAY_ONLINE, IN_KIND
    private String referenceNo; // receipt # or voucher #
    private String partyName; // donor or paidTo
    private String village;
    private String notes;
}
