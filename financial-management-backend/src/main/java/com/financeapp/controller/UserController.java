package com.financeapp.controller;

import com.financeapp.dto.ChangePasswordRequest;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
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

        userRepository.delete(user);
        log.info("User {} deleted successfully by {}", username, currentUsername);
        return ResponseEntity.ok(Map.of("success", "true", "message", "User deleted successfully"));
    }

    /**
     * Delete the authenticated user's account with password verification
     */
    @DeleteMapping("/delete-account")
    public ResponseEntity<Map<String, String>> deleteOwnAccount(
            Authentication authentication, 
            @RequestParam("password") String password) {
        
        String username = authentication.getName();
        log.info("Attempting to delete account for user: {}", username);
        
        boolean deleted = userService.deleteUserAccount(username, password);
        
        if (deleted) {
            log.info("Account deleted successfully for user: {}", username);
            return ResponseEntity.ok(Map.of(
                "success", "true", 
                "message", "Account has been successfully deleted."
            ));
        } else {
            log.warn("Failed to delete account for user: {}", username);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                        "success", "false", 
                        "message", "Authentication failed or account could not be deleted."
                    ));
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
        // Extract username and password from the request
        String[] parts = request.getCurrentPassword().split(":");
        if (parts.length != 2) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", "false", "message", "Invalid request format"));
        }
        
        String username = parts[0];
        String currentPassword = parts[1];
        
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
}