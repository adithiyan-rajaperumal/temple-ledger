package com.temple.ledger.dto.inflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorProfileDto {
    private String donorName;
    private String donorNameTa;
    private String area;
    private String state;
    private String country;
    private String phone;
    private UUID familyId;
    private String familyCode;
}
