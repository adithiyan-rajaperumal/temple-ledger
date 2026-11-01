package com.temple.ledger.dto.outflow;

import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.domain.outflow.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseVoucherResponse {
    private UUID expenseId;
    private String voucherNo;
    private LocalDate expenseDate;
    private ExpenseCategory category;
    private BigDecimal amount;
    private PaymentMode paymentMode;
    private String paidTo;
    private String invoiceBillNo;
    private String volunteerName;
    private String travelModeVehicle;
    private UUID contractorId;
    private String contractorName;
    private String contractMilestoneDesc;
    private BigDecimal contractPaidToDate;
    private BigDecimal contractRemainingBalance;
    private String description;
    private UUID journalEntryId;
    private String journalEntryNumber;
    private String createdBy;
    private Instant createdAt;
}
