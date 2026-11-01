package com.temple.ledger.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.temple.ledger.domain.audit.AuditLog;
import com.temple.ledger.domain.security.User;
import com.temple.ledger.domain.security.UserRole;
import com.temple.ledger.dto.security.CreateUserRequest;
import com.temple.ledger.dto.security.LoginRequest;
import com.temple.ledger.service.AuditService;
import com.temple.ledger.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(SecurityAndAuditTest.TestEndpointsController.class)
class SecurityAndAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserService userService;

    @Autowired
    private AuditService auditService;

    @TestConfiguration
    static class TestConfig {}

    @RestController
    static class TestEndpointsController {
        @GetMapping("/api/v1/public/ping")
        public Map<String, String> publicPing() {
            return Map.of("message", "public pong");
        }

        @GetMapping("/api/v1/donations/ping")
        public Map<String, String> donationsPing() {
            return Map.of("message", "donations pong");
        }

        @GetMapping("/api/v1/expenses/ping")
        public Map<String, String> expensesPing() {
            return Map.of("message", "expenses pong");
        }

        @GetMapping("/api/v1/contractors/ping")
        public Map<String, String> contractorsPing() {
            return Map.of("message", "contractors pong");
        }

        @GetMapping("/api/v1/admin/ping")
        public Map<String, String> adminPing() {
            return Map.of("message", "admin pong");
        }
    }

    private String superAdminToken;
    private String dataEntryToken;

    @BeforeEach
    void setUp() {
        superAdminToken = jwtTokenProvider.generateToken("admin", UserRole.ROLE_SUPER_ADMIN.name());
        dataEntryToken = jwtTokenProvider.generateToken("operator1", UserRole.ROLE_DATA_ENTRY.name());
    }

    @Test
    @DisplayName("Public endpoints allow unauthenticated access")
    void testPublicEndpointPermitAll() throws Exception {
        mockMvc.perform(get("/api/v1/public/ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("public pong"));
    }

    @Test
    @DisplayName("Unauthenticated requests to protected endpoints return 401 Unauthorized")
    void testProtectedEndpointsRequireAuth() throws Exception {
        mockMvc.perform(get("/api/v1/donations/ping"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/expenses/ping"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/ping"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DATA_ENTRY user can access donations, expenses, and contractors routes")
    void testDataEntryUserCanAccessOperatorRoutes() throws Exception {
        mockMvc.perform(get("/api/v1/donations/ping")
                        .header("Authorization", "Bearer " + dataEntryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("donations pong"));

        mockMvc.perform(get("/api/v1/expenses/ping")
                        .header("Authorization", "Bearer " + dataEntryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("expenses pong"));

        mockMvc.perform(get("/api/v1/contractors/ping")
                        .header("Authorization", "Bearer " + dataEntryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("contractors pong"));
    }

    @Test
    @DisplayName("DATA_ENTRY user receives 403 Forbidden when attempting to access admin routes")
    void testDataEntryUserForbiddenOnAdminRoutes() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ping")
                        .header("Authorization", "Bearer " + dataEntryToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SUPER_ADMIN user can access admin endpoints as well as operator endpoints")
    void testSuperAdminAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ping")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("admin pong"));

        mockMvc.perform(get("/api/v1/donations/ping")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Default Super Admin is seeded on startup and can authenticate via /api/v1/auth/login")
    void testDefaultAdminLogin() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin")
                .password("admin123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ROLE_SUPER_ADMIN"));
    }

    @Test
    @DisplayName("Invalid login credentials return 401 Unauthorized")
    void testInvalidLoginReturnsUnauthorized() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Super Admin can create a new data entry operator and view user list")
    void testSuperAdminCreatesDataEntryOperator() throws Exception {
        String newUsername = "operator_" + System.currentTimeMillis();
        CreateUserRequest createReq = CreateUserRequest.builder()
                .username(newUsername)
                .password("secret123")
                .fullName("Suresh Operator")
                .role(UserRole.ROLE_DATA_ENTRY)
                .build();

        // Super Admin creates operator
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(newUsername))
                .andExpect(jsonPath("$.fullName").value("Suresh Operator"))
                .andExpect(jsonPath("$.role").value("ROLE_DATA_ENTRY"));

        // Operator can immediately log in
        LoginRequest operatorLogin = LoginRequest.builder()
                .username(newUsername)
                .password("secret123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(operatorLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(newUsername))
                .andExpect(jsonPath("$.role").value("ROLE_DATA_ENTRY"));

        // Super admin lists users
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("AuditService logs immutable change history with user identity and serialized JSON states")
    void testAuditLogging() throws Exception {
        Map<String, Object> before = Map.of("amount", 5000, "status", "PENDING");
        Map<String, Object> after = Map.of("amount", 5000, "status", "COMPLETED");

        AuditLog log = auditService.logAction(
                "DONATION",
                "DON-12345",
                "UPDATE",
                "admin",
                "127.0.0.1",
                before,
                after,
                "Donor completed pledge payment"
        );

        assertThat(log.getId()).isNotNull();
        assertThat(log.getEntityName()).isEqualTo("DONATION");
        assertThat(log.getEntityId()).isEqualTo("DON-12345");
        assertThat(log.getAction()).isEqualTo("UPDATE");
        assertThat(log.getPerformedBy()).isEqualTo("admin");
        assertThat(log.getIpAddress()).isEqualTo("127.0.0.1");
        assertThat(log.getBeforeState()).contains("\"status\":\"PENDING\"");
        assertThat(log.getAfterState()).contains("\"status\":\"COMPLETED\"");
        assertThat(log.getChangeReason()).isEqualTo("Donor completed pledge payment");
        assertThat(log.getTimestamp()).isNotNull();

        List<AuditLog> history = auditService.getAuditHistory("DONATION", "DON-12345");
        assertThat(history).isNotEmpty();
        assertThat(history.get(0).getEntityId()).isEqualTo("DON-12345");

        // Admin can query audit logs through endpoint
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("JwtTokenProvider validates token integrity and rejects tampering")
    void testJwtTokenProviderValidation() {
        String token = jwtTokenProvider.generateToken("testuser", UserRole.ROLE_DATA_ENTRY.name());
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("testuser");
        assertThat(jwtTokenProvider.getRoleFromToken(token)).isEqualTo("ROLE_DATA_ENTRY");

        // Tampered token
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";
        assertThat(jwtTokenProvider.validateToken(tamperedToken)).isFalse();

        // Empty / garbage token
        assertThat(jwtTokenProvider.validateToken("invalid.token.here")).isFalse();
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }
}
