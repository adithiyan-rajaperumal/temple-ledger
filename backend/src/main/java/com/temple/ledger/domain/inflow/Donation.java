package com.temple.ledger.domain.inflow;

import com.temple.ledger.domain.accounting.JournalEntry;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.community.Pledge;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToOne;
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
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_no", length = 64, unique = true, nullable = false)
    private String receiptNo;

    @Column(name = "donation_date", nullable = false)
    private LocalDate donationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "donor_source", nullable = false)
    private DonationSource donorSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id")
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drive_id")
    private Drive drive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pledge_id")
    private Pledge pledge;

    @Column(name = "donor_name", length = 128, nullable = false)
    private String donorName;

    @Column(name = "donor_name_ta", length = 128)
    private String donorNameTa;

    @Column(name = "village", length = 128)
    private String village;

    @Column(name = "area", length = 128)
    private String area;

    @Column(name = "state", length = 64)
    private String state;

    @Column(name = "country", length = 64)
    private String country;

    @Column(name = "phone", length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false)
    private PaymentMode paymentMode;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "book_no", length = 32)
    private String bookNo;

    @Column(name = "manual_receipt_no", length = 32)
    private String manualReceiptNo;

    @Column(name = "physical_book_receipt_no", length = 64)
    private String physicalBookReceiptNo;

    @Column(name = "gpay_transaction_id", length = 64)
    private String gpayTransactionId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @OneToOne(mappedBy = "donation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private InKindDonation inKindDonation;

    @Column(name = "created_by", length = 64, nullable = false)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public void setInKindDonation(InKindDonation inKindDonation) {
        this.inKindDonation = inKindDonation;
        if (inKindDonation != null) {
            inKindDonation.setDonation(this);
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
        if (this.amount == null) {
            this.amount = BigDecimal.ZERO;
        }
        if (this.country == null || this.country.isBlank()) {
            this.country = "India";
        }
        if (this.state == null || this.state.isBlank()) {
            this.state = "Tamil Nadu";
        }
        if (this.area == null && this.village != null) {
            this.area = this.village;
        }
        if (this.village == null && this.area != null) {
            this.village = this.area;
        }
        syncBookAndReceipt();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        if (this.area == null && this.village != null) {
            this.area = this.village;
        }
        if (this.village == null && this.area != null) {
            this.village = this.area;
        }
        syncBookAndReceipt();
    }

    private void syncBookAndReceipt() {
        if ((this.bookNo != null && !this.bookNo.isBlank()) || (this.manualReceiptNo != null && !this.manualReceiptNo.isBlank())) {
            StringBuilder sb = new StringBuilder();
            if (this.bookNo != null && !this.bookNo.isBlank()) {
                sb.append("Book ").append(this.bookNo.trim());
            }
            if (this.manualReceiptNo != null && !this.manualReceiptNo.isBlank()) {
                if (sb.length() > 0) sb.append(" / ");
                sb.append("Receipt ").append(this.manualReceiptNo.trim());
            }
            this.physicalBookReceiptNo = sb.toString();
        } else if (this.physicalBookReceiptNo != null && !this.physicalBookReceiptNo.isBlank()) {
            if (this.physicalBookReceiptNo.contains("/")) {
                String[] parts = this.physicalBookReceiptNo.split("/", 2);
                this.bookNo = parts[0].trim();
                this.manualReceiptNo = parts[1].trim();
            } else {
                this.manualReceiptNo = this.physicalBookReceiptNo.trim();
            }
        }
    }
}
