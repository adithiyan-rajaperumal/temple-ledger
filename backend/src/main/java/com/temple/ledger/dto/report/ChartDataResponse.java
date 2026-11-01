package com.temple.ledger.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataResponse {
    private List<CategoryChartItem> incomeCategories;
    private List<CategoryChartItem> expenseCategories;
    private InflowOutflowComparison inflowVsOutflow;
}
