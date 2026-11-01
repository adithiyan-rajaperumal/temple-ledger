package com.temple.ledger.service.dto;

import com.temple.ledger.domain.community.DriveStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDriveRequest {
    private String code;
    private String name;
    private String nameTa;
    private BigDecimal defaultTargetPerFamily;
    private LocalDate startDate;
    private LocalDate endDate;
    @Builder.Default
    private DriveStatus status = DriveStatus.ACTIVE;
    private String description;
}
