package com.temple.ledger.controller;

import com.temple.ledger.dto.inflow.CreateDonationRequest;
import com.temple.ledger.dto.inflow.DonationReceiptResponse;
import com.temple.ledger.service.DonationService;
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
@RequestMapping("/api/v1/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<DonationReceiptResponse> recordDonation(
            @Valid @RequestBody CreateDonationRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        DonationReceiptResponse response = donationService.recordDonation(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationReceiptResponse> getDonationById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(reportService.getDonationById(id));
    }
}
