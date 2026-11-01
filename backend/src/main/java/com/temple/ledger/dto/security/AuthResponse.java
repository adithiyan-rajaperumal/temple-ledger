package com.temple.ledger.dto.security;

import com.temple.ledger.domain.security.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String username;
    private String fullName;
    private UserRole role;
    private long expiresIn;
}
