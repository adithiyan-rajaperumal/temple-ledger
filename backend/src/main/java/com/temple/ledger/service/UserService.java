package com.temple.ledger.service;

import com.temple.ledger.domain.security.User;
import com.temple.ledger.domain.security.UserRole;
import com.temple.ledger.dto.security.AdminResetPasswordRequest;
import com.temple.ledger.dto.security.AuthResponse;
import com.temple.ledger.dto.security.ChangePasswordRequest;
import com.temple.ledger.dto.security.CreateUserRequest;
import com.temple.ledger.dto.security.LoginRequest;
import com.temple.ledger.dto.security.UserResponse;
import com.temple.ledger.repository.UserRepository;
import com.temple.ledger.security.JwtTokenProvider;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Lazy(false)
@RequiredArgsConstructor
@Slf4j
public class UserService implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initDefaultAdmin();
    }

    @Transactional
    public void initDefaultAdmin() {
        if (!userRepository.existsByUsername("adithiyan1")) {
            log.info("Initializing custom Super Admin account (adithiyan1)...");
            User superAdmin = User.builder()
                    .username("adithiyan1")
                    .passwordHash(passwordEncoder.encode("Mahaveer2024@"))
                    .fullName("Adithiyan (Super Admin)")
                    .role(UserRole.ROLE_SUPER_ADMIN)
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(superAdmin);
            log.info("Super Admin adithiyan1 successfully initialized.");
        }
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName("System Super Admin")
                    .role(UserRole.ROLE_SUPER_ADMIN)
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(admin);
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

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.logAction(
                "USER",
                user.getId().toString(),
                "UPDATE_PASSWORD",
                username,
                null,
                null,
                null,
                "User changed own password"
        );
        log.info("Password successfully changed for user: '{}'", username);
    }

    @Transactional
    public void adminResetPassword(java.util.UUID userId, AdminResetPasswordRequest request, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.logAction(
                "USER",
                user.getId().toString(),
                "RESET_PASSWORD",
                adminUsername,
                null,
                null,
                null,
                "Super Admin reset password for user: " + user.getUsername()
        );
        log.info("Password for user '{}' reset by Super Admin '{}'", user.getUsername(), adminUsername);
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
