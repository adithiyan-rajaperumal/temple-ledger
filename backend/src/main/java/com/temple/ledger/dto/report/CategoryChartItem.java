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
public class CategoryChartItem {
    private String category;
    private String labelEn;
    private String labelTa;
    private BigDecimal amount;
    private BigDecimal percentage;
}
