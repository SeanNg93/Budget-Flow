package com.financeapp.controller;

import com.financeapp.dto.ChangePasswordRequest;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.UserDeletionService;
import com.financeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for user management operations
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final UserDeletionService userDeletionService;

    /**
     * Delete a user by username (admin can delete any user, regular users can only delete themselves)
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/delete/{username}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String username) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Optional<User> userToDelete = userRepository.findByUsername(username);

        if (userToDelete.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", "false", "message", "User not found"));
        }

        User user = userToDelete.get();

        // Regular users can only delete their own account
        if (!isAdmin && !currentUsername.equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", "false", "message", "You can only delete your own account"));
        }

        // For admin-initiated deletions, bypass the 30-minute wait
        if (isAdmin && !currentUsername.equals(username)) {
            userRepository.delete(user);
            log.info("User {} deleted immediately by admin {}", username, currentUsername);
            return ResponseEntity.ok(Map.of("success", "true", "message", "User deleted successfully"));
        } else {
            // For self-deletions, use the soft delete process
            Map<String, String> result = userDeletionService.requestAccountDeletion(username, "", true);
            return ResponseEntity.ok(result);
        }
    }

    /**
     * Request deletion of the authenticated user's account with password verification
     */
    @DeleteMapping("/delete-account")
    public ResponseEntity<Map<String, String>> requestAccountDeletion(
            Authentication authentication, 
            @RequestParam("password") String password) {
        
        String username = authentication.getName();
        log.info("Requesting account deletion for user: {}", username);
        
        Map<String, String> result = userDeletionService.requestAccountDeletion(username, password, true);
        
        if (result.get("success").equals("true")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }
    
    /**
     * Cancel a pending account deletion
     */
    @PostMapping("/cancel-deletion")
    public ResponseEntity<Map<String, String>> cancelDeletion(Authentication authentication) {
        String username = authentication.getName();
        log.info("Cancelling account deletion for user: {}", username);
        
        Map<String, String> result = userDeletionService.cancelAccountDeletion(username);
        
        if (result.get("success").equals("true")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }

    /**
     * Get the authenticated OAuth2 user's information
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getUser(Authentication authentication) {
        OAuth2User user = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> response = new HashMap<>(user.getAttributes());
        return ResponseEntity.ok(response);
    }

    /**
     * Change the user's password
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody ChangePasswordRequest request) {
        // Get username and password from the request
        String username = request.getUsername();
        String currentPassword = request.getCurrentPassword();
        
        // For backward compatibility, check if the current password contains a username prefix
        if (username == null || username.isEmpty()) {
            // Try to parse from old format if username is not provided
            String[] parts = request.getCurrentPassword().split(":");
            if (parts.length == 2) {
                username = parts[0];
                currentPassword = parts[1];
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", "false", "message", "Username not provided"));
            }
        }
        
        log.info("Attempting to change password for user: {}", username);
        
        boolean changed = userService.changePassword(username, currentPassword, request.getNewPassword());
        
        if (changed) {
            log.info("Password changed successfully for user: {}", username);
            return ResponseEntity.ok(Map.of(
                "success", "true", 
                "message", "Password changed successfully"
            ));
        } else {
            log.warn("Failed to change password for user: {}", username);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                        "success", "false", 
                        "message", "Current password is incorrect or user not found"
                    ));
        }
    }
    
    /**
     * Check if a user has a pending deletion
     */
    @GetMapping("/deletion-status")
    public ResponseEntity<Map<String, Object>> getDeletionStatus(Authentication authentication) {
        if (authentication == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("isPendingDeletion", false);
            return ResponseEntity.ok(response);
        }
        
        String username = authentication.getName();
        boolean isPendingDeletion = userDeletionService.isUserPendingDeletion(username);
        
        Map<String, Object> response = new HashMap<>();
        response.put("isPendingDeletion", isPendingDeletion);
        
        return ResponseEntity.ok(response);
    }
}