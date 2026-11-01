package com.temple.ledger.controller;

import com.temple.ledger.dto.outflow.CreateExpenseRequest;
import com.temple.ledger.dto.outflow.ExpenseVoucherResponse;
import com.temple.ledger.service.ExpenseService;
import com.temple.ledger.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ExpenseVoucherResponse> recordExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        ExpenseVoucherResponse response = expenseService.recordExpense(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseVoucherResponse> getExpenseById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(reportService.getExpenseById(id));
    }
}
