package com.temple.ledger.service.dto;

import com.temple.ledger.domain.community.PledgeStatus;
import com.temple.ledger.domain.community.PledgeType;
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
public class CreatePledgeRequest {
    private String pledgeCode;
    private LocalDate pledgeDate;
    private PledgeType pledgeType;
    private String donorName;
    private String donorNameTa;
    private String village;
    private String phone;
    private UUID familyId;
    private UUID driveId;
    private BigDecimal targetMonetaryAmount;
    private String targetMaterialDesc;
    private BigDecimal targetMaterialQty;
    private String targetMaterialUnit;
    @Builder.Default
    private PledgeStatus status = PledgeStatus.PENDING;
    private String notes;
    private String createdBy;
}
