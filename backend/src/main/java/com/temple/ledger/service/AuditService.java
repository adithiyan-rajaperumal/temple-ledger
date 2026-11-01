package com.temple.ledger.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temple.ledger.domain.audit.AuditLog;
import com.temple.ledger.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AuditLog logAction(
            String entityName,
            String entityId,
            String action,
            String performedBy,
            Object beforeState,
            Object afterState) {
        return logAction(entityName, entityId, action, performedBy, null, beforeState, afterState, null);
    }

    @Transactional
    public AuditLog logAction(
            String entityName,
            String entityId,
            String action,
            String performedBy,
            Object beforeState,
            Object afterState,
            String changeReason) {
        return logAction(entityName, entityId, action, performedBy, null, beforeState, afterState, changeReason);
    }

    @Transactional
    public AuditLog logAction(
            String entityName,
            String entityId,
            String action,
            String performedBy,
            String ipAddress,
            Object beforeState,
            Object afterState,
            String changeReason) {

        String beforeJson = serializeState(beforeState);
        String afterJson = serializeState(afterState);

        AuditLog auditLog = AuditLog.builder()
                .entityName(entityName)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .ipAddress(ipAddress)
                .beforeState(beforeJson)
                .afterState(afterJson)
                .changeReason(changeReason)
                .timestamp(Instant.now())
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("Audit log recorded: action={} entity={}:{} by={}", action, entityName, entityId, performedBy);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditHistory(String entityName, String entityId) {
        return auditLogRepository.findByEntityNameAndEntityIdOrderByTimestampDesc(entityName, entityId);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> findByEntityNameOrderByTimestampDesc(String entityName, Pageable pageable) {
        return auditLogRepository.findByEntityNameOrderByTimestampDesc(entityName, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> listAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> listAllAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    private String serializeState(Object state) {
        if (state == null) {
            return null;
        }
        if (state instanceof String s) {
            return s;
        }
        try {
            return objectMapper.writeValueAsString(state);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize state for audit log: {}", e.getMessage(), e);
            return String.valueOf(state);
        }
    }
}
