package com.temple.ledger.controller;

import com.temple.ledger.domain.community.Pledge;
import com.temple.ledger.service.DriveManagementService;
import com.temple.ledger.service.dto.CreatePledgeRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pledges")
@RequiredArgsConstructor
public class PledgeController {

    private final DriveManagementService driveManagementService;

    @GetMapping
    public ResponseEntity<List<Pledge>> listPledges() {
        return ResponseEntity.ok(driveManagementService.listPledges());
    }

    @PostMapping
    public ResponseEntity<Pledge> createPledge(
            @Valid @RequestBody CreatePledgeRequest request,
            Authentication authentication) {
        if (request.getCreatedBy() == null || request.getCreatedBy().isBlank()) {
            request.setCreatedBy(authentication != null ? authentication.getName() : "system");
        }
        Pledge created = driveManagementService.createPledge(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pledge> getPledgeById(@PathVariable("id") UUID id) {
        return driveManagementService.findPledgeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
