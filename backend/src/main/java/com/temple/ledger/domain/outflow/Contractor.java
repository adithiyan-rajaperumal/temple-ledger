package com.temple.ledger.domain.outflow;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contractors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contractor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "contractor_name", length = 128, nullable = false)
    private String contractorName;

    @Column(name = "trade", length = 64, nullable = false)
    private String trade;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "total_agreed_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalAgreedAmount;

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "ACTIVE";
        }
    }
}
