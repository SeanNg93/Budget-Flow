package com.financeapp.service;

import com.financeapp.dto.WalletRequest;
import com.financeapp.dto.WalletUpdateRequest;
import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.repository.UserRepository;
import com.financeapp.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @Transactional
    public Optional<Wallet> updateWallet(Long walletId, WalletUpdateRequest request, String username) {
        Optional<Wallet> walletOpt = walletRepository.findById(walletId);
        if (walletOpt.isEmpty()) return Optional.empty();

        Wallet wallet = walletOpt.get();
        if (!wallet.getUser().getUsername().equals(username)) return Optional.empty(); // Kiểm tra quyền sở hữu

        // Validate dữ liệu
        if (request.getWalletName() == null || request.getWalletName().trim().isEmpty()) return Optional.empty();
        if (request.getBalance() < 0) return Optional.empty();
        if (!request.getCurrency().matches("VND|USD|EUR")) return Optional.empty();

        // Cập nhật thông tin ví
        wallet.setWalletName(request.getWalletName());
        wallet.setBalance(BigDecimal.valueOf(request.getBalance()));
        wallet.setCurrency(request.getCurrency());
        wallet.setIconUrl(request.getIconUrl());
        wallet.setDescription(request.getDescription());

        return Optional.of(walletRepository.save(wallet));
    }

    public Optional<Wallet> getWalletById(Long id, String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return walletRepository.findByIdAndUser(id, user.get());
        }
        return Optional.empty();
    }

    public List<Wallet> getWalletsByUsername(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        return walletRepository.findByUser(user.get());
    }

    public void createWallet(String username, WalletRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setWalletName(request.getWalletName());
        wallet.setBalance(request.getBalance());
        wallet.setCurrency(request.getCurrency());
        wallet.setIconUrl(request.getIconUrl());
        wallet.setDescription(request.getDescription());

        walletRepository.save(wallet);
    }

}
