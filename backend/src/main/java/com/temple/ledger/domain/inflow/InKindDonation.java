package com.temple.ledger.domain.inflow;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@Table(name = "in_kind_donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InKindDonation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "donation_id", unique = true, nullable = false)
    private Donation donation;

    @Column(name = "item_category", length = 64, nullable = false)
    private String itemCategory;

    @Column(name = "item_description", columnDefinition = "TEXT", nullable = false)
    private String itemDescription;

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit", length = 32, nullable = false)
    private String unit;

    @Column(name = "approximate_unit_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal approximateUnitRate;

    @Column(name = "total_estimated_value", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalEstimatedValue;

    @Column(name = "storage_location", length = 128)
    private String storageLocation;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
