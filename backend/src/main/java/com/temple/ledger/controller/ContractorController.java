package com.temple.ledger.controller;

import com.temple.ledger.dto.outflow.ContractorSummaryResponse;
import com.temple.ledger.dto.outflow.CreateContractorRequest;
import com.temple.ledger.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contractors")
@RequiredArgsConstructor
public class ContractorController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ContractorSummaryResponse>> listContractors() {
        return ResponseEntity.ok(expenseService.listContractors());
    }

    @PostMapping
    public ResponseEntity<ContractorSummaryResponse> createContractor(@Valid @RequestBody CreateContractorRequest request) {
        ContractorSummaryResponse created = expenseService.createContractor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractorSummaryResponse> getContractorById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(expenseService.getContractorSummary(id));
    }
}
