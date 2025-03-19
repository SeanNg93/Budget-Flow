package com.financeapp.controller;

import com.financeapp.dto.PasswordResetConfirmRequest;
import com.financeapp.dto.PasswordResetRequest;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordResetController {
    private static final Logger logger = LoggerFactory.getLogger(PasswordResetController.class);

    private final UserService userService;
    private final UserRepository userRepository;

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
    
    /**
     * Verify if a password reset token is valid and not expired
     */
    @PostMapping("/verify-token")
    public ResponseEntity<?> verifyResetToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        logger.info("Verifying reset token: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "message", "Token is required"
            ));
        }
        
        Optional<User> userOptional = userRepository.findByResetPasswordToken(token);
        
        if (userOptional.isEmpty()) {
            logger.warn("Token not found: {}", token);
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", "Invalid token"
            ));
        }
        
        User user = userOptional.get();
        boolean isValid = user.getResetPasswordTokenExpiry() != null && 
                          user.getResetPasswordTokenExpiry().isAfter(LocalDateTime.now());
        
        logger.info("Token {} is {}", token, isValid ? "valid" : "expired");
        
        return ResponseEntity.ok(Map.of(
            "valid", isValid,
            "message", isValid ? "Token is valid" : "Token has expired"
        ));
    }
} 