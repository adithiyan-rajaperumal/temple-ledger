package com.temple.ledger.dto.outflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractorSummaryResponse {
    private UUID contractorId;
    private String contractorName;
    private String trade;
    private String phone;
    private BigDecimal totalAgreedAmount;
    private BigDecimal paidToDate;
    private BigDecimal remainingRetentionBalance;
    private String status;
    private String notes;
    private Instant createdAt;
}
