package com.temple.ledger.controller;

import com.temple.ledger.domain.audit.AuditLog;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.DriveFamilyAllocation;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.security.User;
import com.temple.ledger.dto.security.CreateUserRequest;
import com.temple.ledger.dto.security.UserResponse;
import com.temple.ledger.service.AuditService;
import com.temple.ledger.service.DriveManagementService;
import com.temple.ledger.service.UserService;
import com.temple.ledger.service.dto.CreateDriveRequest;
import com.temple.ledger.service.dto.CreateFamilyRequest;
import com.temple.ledger.service.dto.UpdateAllocationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final DriveManagementService driveManagementService;
    private final AuditService auditService;

    // --- User Management ---

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "SUPER_ADMIN";
        User user = userService.createUser(request, adminUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toUserResponse(user));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

    // --- Drive Management ---

    @PostMapping("/drives")
    public ResponseEntity<Drive> createDrive(@Valid @RequestBody CreateDriveRequest request) {
        Drive drive = driveManagementService.createDrive(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(drive);
    }

    @PostMapping("/drives/{driveId}/initialize")
    public ResponseEntity<List<DriveFamilyAllocation>> initializeDrive(@PathVariable("driveId") UUID driveId) {
        List<DriveFamilyAllocation> allocations = driveManagementService.initializeDriveAllocations(driveId);
        return ResponseEntity.ok(allocations);
    }

    @PatchMapping("/drives/{driveId}/allocations/{familyId}")
    public ResponseEntity<DriveFamilyAllocation> updateAllocation(
            @PathVariable("driveId") UUID driveId,
            @PathVariable("familyId") UUID familyId,
            @RequestBody UpdateAllocationRequest request) {
        DriveFamilyAllocation allocation = driveManagementService.updateAllocation(driveId, familyId, request);
        return ResponseEntity.ok(allocation);
    }

    // --- Family Management ---

    @PostMapping("/families")
    public ResponseEntity<Family> createFamily(@Valid @RequestBody CreateFamilyRequest request) {
        Family family = driveManagementService.createFamily(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(family);
    }

    @GetMapping("/families")
    public ResponseEntity<List<Family>> listFamilies() {
        return ResponseEntity.ok(driveManagementService.getActiveFamilies());
    }

    // --- Audit Logs ---

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(value = "entityName", required = false) String entityName,
            @RequestParam(value = "entityId", required = false) String entityId,
            @PageableDefault(size = 50) Pageable pageable) {

        if (entityName != null && !entityName.isBlank() && entityId != null && !entityId.isBlank()) {
            List<AuditLog> history = auditService.getAuditHistory(entityName, entityId);
            return ResponseEntity.ok(history);
        }
        if (entityName != null && !entityName.isBlank()) {
            Page<AuditLog> page = auditService.findByEntityNameOrderByTimestampDesc(entityName, pageable);
            return ResponseEntity.ok(page);
        }
        Page<AuditLog> page = auditService.listAllAuditLogs(pageable);
        return ResponseEntity.ok(page);
    }
}
