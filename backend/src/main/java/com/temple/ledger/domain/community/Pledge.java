package com.temple.ledger.domain.community;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pledges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pledge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pledge_code", length = 32, unique = true, nullable = false)
    private String pledgeCode;

    @Column(name = "pledge_date", nullable = false)
    private LocalDate pledgeDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "pledge_type", nullable = false)
    private PledgeType pledgeType = PledgeType.MONETARY;

    @Column(name = "donor_name", length = 128, nullable = false)
    private String donorName;

    @Column(name = "donor_name_ta", length = 128)
    private String donorNameTa;

    @Column(name = "village", length = 128)
    private String village;

    @Column(name = "phone", length = 20)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id")
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drive_id")
    private Drive drive;

    @Builder.Default
    @Column(name = "target_monetary_amount", precision = 12, scale = 2)
    private BigDecimal targetMonetaryAmount = BigDecimal.ZERO;

    @Column(name = "target_material_desc", columnDefinition = "TEXT")
    private String targetMaterialDesc;

    @Builder.Default
    @Column(name = "target_material_qty", precision = 10, scale = 2)
    private BigDecimal targetMaterialQty = BigDecimal.ZERO;

    @Column(name = "target_material_unit", length = 32)
    private String targetMaterialUnit;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PledgeStatus status = PledgeStatus.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by", length = 64, nullable = false)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
        if (this.targetMonetaryAmount == null) {
            this.targetMonetaryAmount = BigDecimal.ZERO;
        }
        if (this.targetMaterialQty == null) {
            this.targetMaterialQty = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
