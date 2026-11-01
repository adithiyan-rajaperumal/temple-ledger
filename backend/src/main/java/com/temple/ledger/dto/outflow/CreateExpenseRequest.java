package com.temple.ledger.dto.outflow;

import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.domain.outflow.ExpenseCategory;
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
public class CreateExpenseRequest {
    private LocalDate expenseDate;
    private ExpenseCategory category;
    private BigDecimal amount;
    private PaymentMode paymentMode;
    private String paidTo;
    private UUID contractorId;
    private String contractMilestoneDesc;
    private String volunteerName;
    private String travelModeVehicle;
    private String invoiceBillNo;
    private String description;
}
