package com.temple.ledger.controller;

import com.temple.ledger.dto.inflow.DonationReceiptResponse;
import com.temple.ledger.dto.report.ChartDataResponse;
import com.temple.ledger.dto.report.DashboardSummaryResponse;
import com.temple.ledger.dto.report.PublicDriveListItemResponse;
import com.temple.ledger.dto.report.PublicDriveProgressResponse;
import com.temple.ledger.dto.report.TransactionGridItemResponse;
import com.temple.ledger.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }

    @GetMapping("/dashboard/charts")
    public ResponseEntity<ChartDataResponse> getChartData() {
        return ResponseEntity.ok(reportService.getChartData());
    }

    @GetMapping("/drives")
    public ResponseEntity<List<PublicDriveListItemResponse>> listDrives() {
        return ResponseEntity.ok(reportService.listPublicDrives());
    }

    @GetMapping("/drives/{driveId}/families")
    public ResponseEntity<PublicDriveProgressResponse> getDriveFamilyProgress(@PathVariable("driveId") UUID driveId) {
        return ResponseEntity.ok(reportService.getPublicDriveProgress(driveId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionGridItemResponse>> getTransactions(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "flowType", required = false) String flowType,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "paymentMode", required = false) String paymentMode,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 50) Pageable pageable) {

        Page<TransactionGridItemResponse> page = reportService.getTransactions(
                search, flowType, category, paymentMode, startDate, endDate, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/receipts/{receiptNo}")
    public ResponseEntity<DonationReceiptResponse> getPublicReceipt(@PathVariable("receiptNo") String receiptNo) {
        return ResponseEntity.ok(reportService.getPublicReceipt(receiptNo));
    }
}
