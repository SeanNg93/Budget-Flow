package com.financeapp.controller;

import com.financeapp.dto.WalletRequest;
import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.repository.WalletRepository;
import com.financeapp.security.JwtUtils;
import com.financeapp.service.UserService;
import com.financeapp.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {
    private final WalletRepository walletRepository;
    private final UserService userService;
    private final JwtUtils jwtUtils;
    private final WalletService walletService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<?> createWallet(@RequestBody WalletRequest request, Authentication authentication) {
        String username = authentication.getName();
        walletService.createWallet(username, request);
        return ResponseEntity.ok(Map.of("success", "true", "message", "Wallet created successfully"));
    }

    @GetMapping
    public ResponseEntity<List<Wallet>> getUserWallets(Authentication authentication) {
        String username = authentication.getName();
        List<Wallet> wallets = walletService.getWalletsByUsername(username);
        return ResponseEntity.ok(wallets);
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateWallet(@PathVariable Long id,
                                          @Valid @RequestBody Map<String, Object> walletData,
                                          Authentication authentication) {
        // Lấy user hiện tại từ authentication
        String username = authentication.getName();
        Optional<User> userOptional = userService.getUserByUsername(username);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
        }
        User user = userOptional.get();

        // Kiểm tra ví có thuộc về user không
        Optional<Wallet> walletOptional = walletRepository.findByIdAndUser(id, user);
        if (walletOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Wallet not found or unauthorized"));
        }
        Wallet wallet = walletOptional.get();

        // Cập nhật dữ liệu từ request
        if (walletData.containsKey("walletName")) {
            wallet.setWalletName(walletData.get("walletName").toString());
        }
        if (walletData.containsKey("balance")) {
            wallet.setBalance(new BigDecimal(walletData.get("balance").toString()));
        }
        if (walletData.containsKey("currency")) {
            wallet.setCurrency(walletData.get("currency").toString());
        }
        if (walletData.containsKey("iconUrl")) {
            wallet.setIconUrl(walletData.get("iconUrl").toString());
        }
        if (walletData.containsKey("description")) {
            wallet.setDescription(walletData.get("description").toString());
        }

        // Lưu vào database
        walletRepository.save(wallet);

        return ResponseEntity.ok(Map.of("success", true, "message", "Wallet updated successfully", "wallet", wallet));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Wallet> getWalletById(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        Optional<Wallet> wallet = walletService.getWalletById(id, username);

        return wallet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
