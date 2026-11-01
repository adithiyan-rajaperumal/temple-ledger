package com.temple.ledger.dto.security;

import com.temple.ledger.domain.security.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private String username;
    private String fullName;
    private UserRole role;
    private boolean isActive;
    private Instant createdAt;
}
