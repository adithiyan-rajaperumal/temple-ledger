package com.temple.ledger.controller;

import com.temple.ledger.domain.security.User;
import com.temple.ledger.dto.security.CreateUserRequest;
import com.temple.ledger.dto.security.UserResponse;
import com.temple.ledger.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "SUPER_ADMIN";
        User user = userService.createUser(request, adminUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toUserResponse(user));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }
}
