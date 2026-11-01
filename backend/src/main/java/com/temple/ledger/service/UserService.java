package com.temple.ledger.service;

import com.temple.ledger.domain.security.User;
import com.temple.ledger.domain.security.UserRole;
import com.temple.ledger.dto.security.AuthResponse;
import com.temple.ledger.dto.security.CreateUserRequest;
import com.temple.ledger.dto.security.LoginRequest;
import com.temple.ledger.dto.security.UserResponse;
import com.temple.ledger.repository.UserRepository;
import com.temple.ledger.security.JwtTokenProvider;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    @PostConstruct
    @Transactional
    public void initDefaultAdmin() {
        if (userRepository.count() == 0) {
            log.info("No users found in database. Initializing default Super Admin account (admin / admin123)...");
            User superAdmin = User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName("System Super Admin")
                    .role(UserRole.ROLE_SUPER_ADMIN)
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(superAdmin);
            log.info("Default Super Admin successfully initialized.");
        }
    }

    @Transactional
    public User createUser(CreateUserRequest request, String adminUsername) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.ROLE_DATA_ENTRY;

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .isActive(true)
                .createdAt(Instant.now())
                .build();

        User saved = userRepository.save(user);

        auditService.logAction(
                "USER",
                saved.getId().toString(),
                "CREATE",
                adminUsername != null ? adminUsername : "SYSTEM",
                null,
                null,
                toUserResponse(saved),
                "Created user account " + saved.getUsername() + " with role " + role.name()
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
