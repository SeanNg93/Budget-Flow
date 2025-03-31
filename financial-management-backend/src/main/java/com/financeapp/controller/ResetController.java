package com.financeapp.controller;

import com.financeapp.model.User;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.repository.WalletRepository;
import com.financeapp.repository.TransactionCategoryRepository;
import com.financeapp.repository.UserProfileRepository;
import com.financeapp.repository.NotificationRepository;
import com.financeapp.repository.SharedWalletRepository;
import com.financeapp.service.UserProfileService;
import com.financeapp.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for data reset operations
 */
@RestController
@RequestMapping("/api/reset")
@RequiredArgsConstructor
@Slf4j
public class ResetController {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final TransactionCategoryRepository categoryRepository;
    private final UserProfileRepository userProfileRepository;
    private final NotificationRepository notificationRepository;
    private final SharedWalletRepository sharedWalletRepository;
    private final UserProfileService userProfileService;
    private final SecurityUtils securityUtils;

    /**
     * Reset all financial data for the current user
     */
    @PostMapping("/all-data")
    @Transactional
    public ResponseEntity<?> resetAllData() {
        try {
            // Get current user
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            Long userId = currentUser.getId();
            log.info("Resetting all financial data for user: {}", currentUser.getUsername());
            
            // Delete all transactions created by the user
            int transactionsDeleted = transactionRepository.deleteAllByUserId(userId);
            log.info("Deleted {} transactions for user ID: {}", transactionsDeleted, userId);
            
            // Delete all shared wallets for this user
            int sharedWalletsDeleted = sharedWalletRepository.deleteAllByUserIdOrSharedWithId(userId, userId);
            log.info("Deleted {} shared wallet relationships for user ID: {}", sharedWalletsDeleted, userId);
            
            // Delete all wallets owned by the user
            int walletsDeleted = walletRepository.deleteAllByUserId(userId);
            log.info("Deleted {} wallets for user ID: {}", walletsDeleted, userId);
            
            // Delete all categories created by the user
            int categoriesDeleted = categoryRepository.deleteAllByUserId(userId);
            log.info("Deleted {} categories for user ID: {}", categoriesDeleted, userId);
            
            // Delete all notifications for the user
            int notificationsDeleted = notificationRepository.deleteAllByUserId(userId);
            log.info("Deleted {} notifications for user ID: {}", notificationsDeleted, userId);
            
            // Reset total balance in user profile to zero
            userProfileService.updateTotalBalance(userId, BigDecimal.ZERO);
            log.info("Reset total balance to zero for user ID: {}", userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All financial data has been reset successfully");
            response.put("transactions_deleted", transactionsDeleted);
            response.put("wallets_deleted", walletsDeleted);
            response.put("categories_deleted", categoriesDeleted);
            response.put("notifications_deleted", notificationsDeleted);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting financial data: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Server Error");
            errorResponse.put("message", "An unexpected error occurred while resetting your financial data");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
} 