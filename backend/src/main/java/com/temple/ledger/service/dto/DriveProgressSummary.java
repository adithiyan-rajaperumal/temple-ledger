package com.temple.ledger.service.dto;

import com.temple.ledger.domain.community.DriveFamilyAllocation;
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
public class DriveProgressSummary {
    private UUID driveId;
    private String driveCode;
    private String driveName;
    private BigDecimal defaultTargetPerFamily;
    private BigDecimal totalActiveTarget;
    private BigDecimal totalTargetAmount;
    private int totalAllocationsCount;
    private int participatingCount;
    private int optedOutCount;
    private int exemptedCount;
    private List<DriveFamilyAllocation> allocations;

    public BigDecimal getTotalTargetAmount() {
        return totalTargetAmount != null ? totalTargetAmount : totalActiveTarget;
    }
}
