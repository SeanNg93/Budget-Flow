package com.financeapp.controller;

import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.AccountService;
import com.financeapp.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserRepository userRepository;
    private final AccountService accountService;

    @Autowired
    public TransactionController(TransactionService transactionService, UserRepository userRepository, AccountService accountService) {
        this.transactionService = transactionService;
        this.userRepository = userRepository;
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        List<Transaction> transactions = transactionService.getAllTransactionsByUserId(userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionService.getTransactionById(id);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @RequestBody Transaction transaction,
            @RequestParam Long accountId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        Transaction createdTransaction = transactionService.createTransaction(transaction, userId, accountId);
        return new ResponseEntity<>(createdTransaction, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable Long id,
            @RequestBody Transaction transactionDetails) {
        Transaction updatedTransaction = transactionService.updateTransaction(id, transactionDetails);
        return ResponseEntity.ok(updatedTransaction);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> getFinancialSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        
        Map<String, BigDecimal> summary = new HashMap<>();
        summary.put("totalBalance", accountService.getTotalBalance(userId));
        summary.put("totalIncome", transactionService.getTotalIncome(userId));
        summary.put("totalExpense", transactionService.getTotalExpense(userId));
        summary.put("netSavings", transactionService.getNetSavings(userId));
        summary.put("currentMonthIncome", transactionService.getCurrentMonthIncome(userId));
        summary.put("currentMonthExpense", transactionService.getCurrentMonthExpense(userId));
        summary.put("currentMonthNetSavings", transactionService.getCurrentMonthNetSavings(userId));
        
        return ResponseEntity.ok(summary);
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