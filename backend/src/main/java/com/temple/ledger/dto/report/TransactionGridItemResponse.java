package com.temple.ledger.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionGridItemResponse {
    private UUID id;
    private LocalDate date;
    private String flowType; // INCOME, EXPENSE, IN_KIND
    private String category;
    private String categoryTa;
    private BigDecimal amount;
    private String paymentMode; // CASH, GPAY_ONLINE, IN_KIND
    private String referenceNo; // receipt # or voucher #
    private String bookNo;
    private String manualReceiptNo;
    private String physicalBookReceiptNo;
    private String gpayTransactionId;
    private String partyName; // donor or paidTo
    private String donorNameTa;
    private String phone;
    private String doorNo;
    private String street;
    private String village;
    private String area;
    private String state;
    private String country;
    private String familyCode;
    private String headName;
    private String headNameTa;
    private String driveCode;
    private String driveName;
    private String driveNameTa;

    // In-Kind specifics
    private String inKindItemCategory;
    private String inKindItemDescription;
    private BigDecimal inKindQuantity;
    private String inKindUnit;
    private BigDecimal inKindApproximateUnitRate;
    private BigDecimal inKindTotalEstimatedValue;

    // Expense specifics
    private String invoiceBillNo;
    private String contractorName;
    private String contractMilestoneDesc;
    private String volunteerName;
    private String travelModeVehicle;

    // Audit & notes
    private String notes;
    private String createdBy;
    private Instant createdAt;
}
