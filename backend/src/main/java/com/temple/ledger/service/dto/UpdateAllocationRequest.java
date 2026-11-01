package com.temple.ledger.service.dto;

import com.temple.ledger.domain.community.CommitmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAllocationRequest {
    private BigDecimal targetAmount;
    private CommitmentStatus status;
    private String notes;
}
