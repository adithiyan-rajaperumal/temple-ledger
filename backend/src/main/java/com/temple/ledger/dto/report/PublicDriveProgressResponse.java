package com.temple.ledger.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicDriveProgressResponse {
    private UUID driveId;
    private String driveCode;
    private String driveName;
    private String driveNameTa;
    private BigDecimal defaultTargetPerFamily;
    private BigDecimal totalTargetAmount;
    private BigDecimal totalCollectedAmount;
    private BigDecimal totalPendingAmount;
    private BigDecimal completionPercentage;
    private int totalFamiliesCount;
    private int participatingCount;
    private int optedOutCount;
    private int exemptedCount;
    private List<FamilyDriveProgressDto> families;
}
