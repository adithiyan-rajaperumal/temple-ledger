package com.temple.ledger.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFamilyRequest {
    private String familyCode;
    private String headName;
    private String headNameTa;
    private String doorNo;
    private String street;
    @Builder.Default
    private String village = "Main Village";
    private String phone;
    @Builder.Default
    private boolean isActive = true;
}
