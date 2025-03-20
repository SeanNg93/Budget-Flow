package com.financeapp.controller;

import com.financeapp.exception.InsufficientFundsException;
import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.service.WalletService;
import com.financeapp.service.TransactionService;
import com.financeapp.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

/**
 * Controller for managing financial transactions
 */
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;
    private final WalletService walletService;
    private final SecurityUtils securityUtils;

    /**
     * Get all transactions for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        try {
            String username = securityUtils.getCurrentUsername();
            log.info("Getting all transactions for user: {}", username);
            
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            List<Transaction> transactions = transactionService.getAllTransactionsByUserId(currentUser.getId());
            
            log.info("Found {} transactions for user: {}", transactions.size(), username);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Error getting transactions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a transaction by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        try {
            log.info("Getting transaction with ID: {}", id);
            
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            Transaction transaction = transactionService.getTransactionById(id);
            
            // Check if transaction belongs to the authenticated user
            if (!transaction.getUser().getId().equals(currentUser.getId())) {
                log.warn("User {} attempted to access transaction {} which belongs to another user", 
                        currentUser.getUsername(), id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("Error getting transaction with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new transaction
     */
    @PostMapping
    public ResponseEntity<?> createTransaction(
            @RequestBody Transaction transaction,
            @RequestParam Long walletId) {
        try {
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            Transaction createdTransaction = transactionService.createTransaction(
                    transaction, currentUser.getId(), walletId);
            
            return new ResponseEntity<>(createdTransaction, HttpStatus.CREATED);
        } catch (Exception e) {
            if (!(e instanceof InsufficientFundsException)) {
                log.error("Error creating transaction: {}", e.getMessage());
            }
            throw e; // Let GlobalExceptionHandler handle it
        }
    }

    /**
     * Update an existing transaction
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransaction(
            @PathVariable Long id,
            @RequestBody Transaction transactionDetails) {
        try {
            log.info("Updating transaction with ID: {}", id);
            
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Check if transaction belongs to the authenticated user
            Transaction existingTransaction = transactionService.getTransactionById(id);
            if (!existingTransaction.getUser().getId().equals(currentUser.getId())) {
                log.warn("User {} attempted to update transaction {} which belongs to another user", 
                        currentUser.getUsername(), id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            Transaction updatedTransaction = transactionService.updateTransaction(id, transactionDetails);
            log.info("Transaction updated successfully with ID: {}", id);
            return ResponseEntity.ok(updatedTransaction);
        } catch (IllegalArgumentException e) {
            // Handle validation errors like insufficient funds
            log.error("Validation error updating transaction: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation Error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error updating transaction with ID {}: {}", id, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Server Error");
            errorResponse.put("message", "An unexpected error occurred while updating your transaction");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Delete a transaction
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        try {
            log.info("Deleting transaction with ID: {}", id);
            
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Check if transaction belongs to the authenticated user
            Transaction existingTransaction = transactionService.getTransactionById(id);
            if (!existingTransaction.getUser().getId().equals(currentUser.getId())) {
                log.warn("User {} attempted to delete transaction {} which belongs to another user", 
                        currentUser.getUsername(), id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            transactionService.deleteTransaction(id);
            log.info("Transaction deleted successfully with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting transaction with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get financial summary for the authenticated user
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> getFinancialSummary() {
        try {
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            log.info("Getting financial summary for user: {}", currentUser.getUsername());
            
            Map<String, BigDecimal> summary = new HashMap<>();
            summary.put("totalBalance", walletService.getTotalBalance(currentUser.getId()));
            summary.put("allocatedBalance", walletService.getAllocatedBalance(currentUser.getId()));
            summary.put("availableBalance", walletService.getAvailableBalance(currentUser.getId()));
            summary.put("totalIncome", transactionService.getTotalIncome(currentUser.getId()));
            summary.put("totalExpense", transactionService.getTotalExpense(currentUser.getId()));
            summary.put("netSavings", transactionService.getNetSavings(currentUser.getId()));
            summary.put("currentMonthIncome", transactionService.getCurrentMonthIncome(currentUser.getId()));
            summary.put("currentMonthExpense", transactionService.getCurrentMonthExpense(currentUser.getId()));
            summary.put("currentMonthNetSavings", transactionService.getCurrentMonthNetSavings(currentUser.getId()));
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error getting financial summary: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/chart-data")
    public ResponseEntity<?> getChartData(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false, defaultValue = "day") String interval,
            @RequestParam(required = false) Integer categoryId) {
        
        try {
            // Get current user
            User currentUser = securityUtils.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }

            // Parse dates - handle both ISO format and date-only format
            DateTimeFormatter isoFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            
            LocalDateTime start;
            LocalDateTime end;
            
            try {
                // Try ISO format first
                start = LocalDateTime.parse(startDate, isoFormatter);
            } catch (Exception e) {
                try {
                    // Try date-only format
                    start = LocalDate.parse(startDate, dateFormatter).atStartOfDay();
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body("Invalid start date format");
                }
            }
            
            try {
                // Try ISO format first
                end = LocalDateTime.parse(endDate, isoFormatter);
            } catch (Exception e) {
                try {
                    // Try date-only format and set to end of day
                    end = LocalDate.parse(endDate, dateFormatter).atTime(23, 59, 59);
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body("Invalid end date format");
                }
            }
            
            // Validate interval
            if (!Arrays.asList("day", "week", "month", "year").contains(interval)) {
                interval = "day"; // Default to day if invalid
            }
            
            // Get financial data for chart
            List<Map<String, Object>> chartData = transactionService.getFinancialDataByDateRange(
                    currentUser.getId(), start, end, categoryId, interval);
            
            // Get summary data
            Map<String, Object> summaryData = transactionService.getFinancialSummaryByDateRange(
                    currentUser.getId(), start, end, categoryId);
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("chartData", chartData);
            response.put("summaryData", summaryData);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving chart data: " + e.getMessage());
        }
    }
} 