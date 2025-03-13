package com.financeapp.controller;

import com.financeapp.dto.AddBalanceRequest;
import com.financeapp.model.Account;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;
    private final UserRepository userRepository;

    @Autowired
    public AccountController(AccountService accountService, UserRepository userRepository) {
        this.accountService = accountService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        List<Account> accounts = accountService.getAllAccountsByUserId(userId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(@PathVariable Long id) {
        Account account = accountService.getAccountById(id);
        return ResponseEntity.ok(account);
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        Account createdAccount = accountService.createAccount(account, userId);
        return new ResponseEntity<>(createdAccount, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(@PathVariable Long id, @RequestBody Account accountDetails) {
        Account updatedAccount = accountService.updateAccount(id, accountDetails);
        return ResponseEntity.ok(updatedAccount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total-balance")
    public ResponseEntity<BigDecimal> getTotalBalance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        BigDecimal totalBalance = accountService.getTotalBalance(userId);
        return ResponseEntity.ok(totalBalance);
    }

    @PostMapping("/add-to-balance")
    public ResponseEntity<BigDecimal> addToTotalBalance(@RequestBody AddBalanceRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        
        BigDecimal newTotalBalance = accountService.addToTotalBalance(userId, request.getAmount());
        return ResponseEntity.ok(newTotalBalance);
    }

    @PutMapping("/update-balance")
    public ResponseEntity<BigDecimal> updateTotalBalance(@RequestBody AddBalanceRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        
        BigDecimal newTotalBalance = accountService.updateTotalBalance(userId, request.getAmount());
        return ResponseEntity.ok(newTotalBalance);
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