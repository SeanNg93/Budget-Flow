package com.financeapp.controller;

import com.financeapp.dto.AddBalanceRequest;
import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    @Autowired
    public WalletController(WalletService walletService, UserRepository userRepository) {
        this.walletService = walletService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Wallet>> getAllWallets() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        List<Wallet> wallets = walletService.getAllWalletsByUserId(userId);
        return ResponseEntity.ok(wallets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Wallet> getWalletById(@PathVariable Long id) {
        Wallet wallet = walletService.getWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping
    public ResponseEntity<Wallet> createWallet(@RequestBody Wallet wallet) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        Wallet createdWallet = walletService.createWallet(wallet, userId);
        return new ResponseEntity<>(createdWallet, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Wallet> updateWallet(@PathVariable Long id, @RequestBody Wallet walletDetails) {
        Wallet updatedWallet = walletService.updateWallet(id, walletDetails);
        return ResponseEntity.ok(updatedWallet);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWallet(@PathVariable Long id) {
        walletService.deleteWallet(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total-balance")
    public ResponseEntity<Map<String, Object>> getWalletBalances() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        
        // Get relevant balance information
        BigDecimal totalBalance = walletService.getTotalBalance(userId);
        BigDecimal allocatedBalance = walletService.getAllocatedBalance(userId);
        BigDecimal availableBalance = walletService.getAvailableBalance(userId);
        
        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("totalBalance", totalBalance);
        response.put("allocatedBalance", allocatedBalance);
        response.put("availableBalance", availableBalance);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/add-to-balance")
    public ResponseEntity<Map<String, Object>> addToTotalBalance(@RequestBody AddBalanceRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        
        BigDecimal newTotalBalance = walletService.addToTotalBalance(userId, request.getAmount());
        
        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("totalBalance", newTotalBalance);
        response.put("allocatedBalance", walletService.getAllocatedBalance(userId));
        response.put("availableBalance", walletService.getAvailableBalance(userId));
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-balance")
    public ResponseEntity<Map<String, Object>> updateTotalBalance(@RequestBody AddBalanceRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = getUserIdFromUsername(username);
        
        try {
            BigDecimal newTotalBalance = walletService.updateTotalBalance(userId, request.getAmount());
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("totalBalance", newTotalBalance);
            response.put("allocatedBalance", walletService.getAllocatedBalance(userId));
            response.put("availableBalance", walletService.getAvailableBalance(userId));
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
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