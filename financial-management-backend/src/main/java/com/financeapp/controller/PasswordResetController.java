package com.financeapp.controller;

import com.financeapp.dto.PasswordResetConfirmRequest;
import com.financeapp.dto.PasswordResetRequest;
import com.financeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordResetController {

    private final UserService userService;

    @PostMapping("/reset-request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody PasswordResetRequest request) {
        Map<String, String> result = userService.requestPasswordReset(request.getEmail());

        if ("true".equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/reset-confirm")
    public ResponseEntity<?> confirmPasswordReset(@RequestBody PasswordResetConfirmRequest request) {
        boolean success = userService.confirmPasswordReset(request.getToken(), request.getNewPassword());
        if (success) {
            return ResponseEntity.ok().body(Map.of("success", "true", "message", "Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "Invalid or expired token"));
        }
    }
} 