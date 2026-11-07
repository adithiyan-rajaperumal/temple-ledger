package com.temple.ledger.dto.inflow;

import com.temple.ledger.domain.inflow.DonationSource;
import com.temple.ledger.domain.inflow.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDonationRequest {
    private LocalDate donationDate;
    private DonationSource donorSource;
    private UUID familyId;
    private UUID driveId;
    private UUID pledgeId;
    private String donorName;
    private String donorNameTa;
    private String village;
    private String area;
    private String state;
    private String country;
    private String phone;
    private PaymentMode paymentMode;
    private BigDecimal amount;
    private String physicalBookReceiptNo;
    private String gpayTransactionId;
    private String notes;

    // In-kind specific fields
    private String itemCategory;
    private String itemDescription;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal approximateUnitRate;
    private String storageLocation;
}
