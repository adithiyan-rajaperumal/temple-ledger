package com.temple.ledger.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private BigDecimal spendableCashAndBankBalance;
    private BigDecimal totalMonetaryInflow;
    private BigDecimal totalMonetaryOutflow;
    private BigDecimal totalInKindValuation;
    private BigDecimal pendingFamilyDriveBalance;
    private BigDecimal pendingContractorLiabilities;
}
