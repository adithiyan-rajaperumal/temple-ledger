package com.temple.ledger.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyDriveProgressDto {
    private UUID familyId;
    private String familyCode;
    private String headName;
    private String headNameTa;
    private String doorNo;
    private String street;
    private String village;
    private BigDecimal targetAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private String status; // PAID, PARTIAL, PENDING, OPTED_OUT, EXEMPTED
}
