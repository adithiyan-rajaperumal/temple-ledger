package com.temple.ledger.controller;

import com.temple.ledger.domain.audit.AuditLog;
import com.temple.ledger.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(value = "entityName", required = false) String entityName,
            @RequestParam(value = "entityId", required = false) String entityId,
            @PageableDefault(size = 50) Pageable pageable) {

        if (entityName != null && entityId != null) {
            List<AuditLog> history = auditService.getAuditHistory(entityName, entityId);
            return ResponseEntity.ok(history);
        }
        Page<AuditLog> page = auditService.listAllAuditLogs(pageable);
        return ResponseEntity.ok(page);
    }
}
