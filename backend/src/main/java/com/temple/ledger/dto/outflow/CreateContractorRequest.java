package com.temple.ledger.dto.outflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContractorRequest {
    private String contractorName;
    private String trade;
    private String phone;
    private BigDecimal totalAgreedAmount;
    private String status;
    private String notes;
}
