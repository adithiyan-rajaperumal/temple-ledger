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
public class InflowOutflowComparison {
    private BigDecimal totalInflows;
    private BigDecimal totalOutflows;
    private BigDecimal netBalance;
}
