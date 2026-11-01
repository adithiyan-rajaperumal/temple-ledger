package com.temple.ledger.dto.report;

import com.temple.ledger.domain.community.DriveStatus;
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
public class PublicDriveListItemResponse {
    private UUID id;
    private String code;
    private String name;
    private String nameTa;
    private BigDecimal defaultTargetPerFamily;
    private LocalDate startDate;
    private LocalDate endDate;
    private DriveStatus status;
    private String description;
}
