package com.financeapp.controller;

import com.financeapp.dto.ShareWalletRequest;
import com.financeapp.dto.SharedWalletDto;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.SharedWalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/shared-wallets")
public class SharedWalletController {

    private static final Logger logger = LoggerFactory.getLogger(SharedWalletController.class);
    private final SharedWalletService sharedWalletService;
    private final UserRepository userRepository;

    @Autowired
    public SharedWalletController(SharedWalletService sharedWalletService, UserRepository userRepository) {
        this.sharedWalletService = sharedWalletService;
        this.userRepository = userRepository;
    }

    /**
     * Share a wallet with another user
     */
    @PostMapping("/share")
    public ResponseEntity<?> shareWallet(@RequestBody ShareWalletRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long ownerId = getUserIdFromUsername(username);
            
            // Parse target user ID from string to long if needed
            Long targetUserId;
            try {
                targetUserId = Long.parseLong(request.getTargetUserId());
            } catch (NumberFormatException e) {
                // If not a number, try to look up by username
                Optional<User> targetUser = userRepository.findByUsername(request.getTargetUserId());
                if (!targetUser.isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Target user not found"));
                }
                targetUserId = targetUser.get().getId();
            }
            
            SharedWalletDto result = sharedWalletService.shareWallet(
                request.getWalletId(),
                ownerId,
                targetUserId
            );
            
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for wallet sharing: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error sharing wallet", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all wallets shared with the current user
     */
    @GetMapping("/shared-with-me")
    public ResponseEntity<?> getWalletsSharedWithMe() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            List<SharedWalletDto> sharedWallets = sharedWalletService.getWalletsSharedWithUser(userId);
            return ResponseEntity.ok(sharedWallets);
        } catch (Exception e) {
            logger.error("Error retrieving shared wallets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all wallets shared by the current user
     */
    @GetMapping("/shared-by-me")
    public ResponseEntity<?> getWalletsSharedByMe() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            List<SharedWalletDto> sharedWallets = sharedWalletService.getWalletsSharedByUser(userId);
            return ResponseEntity.ok(sharedWallets);
        } catch (Exception e) {
            logger.error("Error retrieving shared wallets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Accept a shared wallet
     */
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptSharedWallet(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            SharedWalletDto result = sharedWalletService.acceptSharedWallet(id, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for accepting shared wallet: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error accepting shared wallet", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Remove a shared wallet
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeSharedWallet(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            sharedWalletService.removeSharedWallet(id, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for removing shared wallet: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error removing shared wallet", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Helper method to get user ID from username
    private Long getUserIdFromUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("User not found with username: " + username);
        }
        return userOptional.get().getId();
    }
} 