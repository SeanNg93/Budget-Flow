package com.financeapp.service;

import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.repository.UserRepository;
import com.financeapp.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final UserProfileService userProfileService;

    @Autowired
    public WalletService(WalletRepository walletRepository, UserRepository userRepository, UserProfileService userProfileService) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.userProfileService = userProfileService;
    }

    public List<Wallet> getAllWalletsByUserId(Long userId) {
        List<Wallet> wallets = walletRepository.findByUserId(userId);
        
        // If user has no wallets, create a default one
        if (wallets.isEmpty()) {
            createDefaultWallet(userId);
            wallets = walletRepository.findByUserId(userId);
        }
        
        return wallets;
    }

    public Wallet getWalletById(Long id) {
        return walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + id));
    }

    @Transactional
    public Wallet createWallet(Wallet wallet, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Check if creating this wallet would exceed the total balance
        BigDecimal availableBalance = getAvailableBalance(userId);
        if (wallet.getBalance().compareTo(availableBalance) > 0) {
            throw new IllegalArgumentException("Wallet balance cannot exceed available balance. Available: " 
                + availableBalance + ", Requested: " + wallet.getBalance());
        }
        
        wallet.setUser(user);
        // Ensure balance and currency are set
        if (wallet.getBalance() == null) {
            wallet.setBalance(BigDecimal.ZERO);
        }
        if (wallet.getCurrency() == null || wallet.getCurrency().isEmpty()) {
            wallet.setCurrency("USD");
        }
        
        return walletRepository.save(wallet);
    }

    @Transactional
    public Wallet updateWallet(Long id, Wallet walletDetails) {
        Wallet wallet = getWalletById(id);
        User user = wallet.getUser();
        
        // Calculate the change in balance
        BigDecimal currentBalance = wallet.getBalance();
        BigDecimal newBalance = walletDetails.getBalance();
        BigDecimal balanceChange = newBalance.subtract(currentBalance);
        
        // If balance is increasing, check if there's enough available balance
        if (balanceChange.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal availableBalance = getAvailableBalance(user.getId());
            if (balanceChange.compareTo(availableBalance) > 0) {
                throw new IllegalArgumentException("Increasing wallet balance by " + balanceChange 
                    + " exceeds available balance of " + availableBalance);
            }
        }
        
        // Update wallet properties
        wallet.setAccountName(walletDetails.getAccountName());
        wallet.setBalance(newBalance);
        if (walletDetails.getCurrency() != null && !walletDetails.getCurrency().isEmpty()) {
            wallet.setCurrency(walletDetails.getCurrency());
        }
        
        return walletRepository.save(wallet);
    }

    @Transactional
    public void deleteWallet(Long id) {
        Wallet wallet = getWalletById(id);
        walletRepository.delete(wallet);
    }

    /**
     * Updates the balance of a wallet.
     * 
     * @param id Wallet ID
     * @param newBalance The new balance
     * @return Updated wallet
     */
    @Transactional
    public Wallet updateBalance(Long id, BigDecimal newBalance) {
        Wallet wallet = getWalletById(id);
        User user = wallet.getUser();
        
        // Calculate balance change
        BigDecimal currentBalance = wallet.getBalance();
        BigDecimal balanceChange = newBalance.subtract(currentBalance);
        
        // If balance is increasing, check available balance
        if (balanceChange.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal availableBalance = getAvailableBalance(user.getId());
            if (balanceChange.compareTo(availableBalance) > 0) {
                throw new IllegalArgumentException("Increasing wallet balance by " + balanceChange 
                    + " exceeds available balance of " + availableBalance);
            }
        }
        
        wallet.setBalance(newBalance);
        return walletRepository.save(wallet);
    }

    /**
     * Adds specified amount to wallet balance.
     * 
     * @param id Wallet ID
     * @param amount Amount to add
     * @return Updated wallet
     */
    @Transactional
    public Wallet addToBalance(Long id, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount to add must be positive");
        }
        
        Wallet wallet = getWalletById(id);
        User user = wallet.getUser();
        
        // Check available balance
        BigDecimal availableBalance = getAvailableBalance(user.getId());
        if (amount.compareTo(availableBalance) > 0) {
            throw new IllegalArgumentException("Adding " + amount 
                + " to wallet exceeds available balance of " + availableBalance);
        }
        
        BigDecimal newBalance = wallet.getBalance().add(amount);
        wallet.setBalance(newBalance);
        return walletRepository.save(wallet);
    }

    /**
     * Subtracts specified amount from wallet balance.
     * 
     * @param id Wallet ID
     * @param amount Amount to subtract
     * @return Updated wallet
     */
    @Transactional
    public Wallet subtractFromBalance(Long id, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount to subtract must be positive");
        }
        
        Wallet wallet = getWalletById(id);
        BigDecimal newBalance = wallet.getBalance().subtract(amount);
        wallet.setBalance(newBalance);
        return walletRepository.save(wallet);
    }

    /**
     * Creates a default wallet for a user.
     * 
     * @param userId User ID
     * @return Created wallet
     */
    @Transactional
    public Wallet createDefaultWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setAccountName("Main Wallet");
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setCurrency("USD");
        
        return walletRepository.save(wallet);
    }

    /**
     * Get total balance across all wallets.
     * 
     * @param userId User ID
     * @return Total balance
     */
    public BigDecimal getAllocatedBalance(Long userId) {
        List<Wallet> wallets = walletRepository.findByUserId(userId);
        
        return wallets.stream()
                .map(Wallet::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * Gets the total balance from user profile, which represents all available money.
     * 
     * @param userId User ID
     * @return Total balance
     */
    public BigDecimal getTotalBalance(Long userId) {
        return userProfileService.getTotalBalance(userId);
    }
    
    /**
     * Gets the available balance (total balance minus allocated balance).
     * 
     * @param userId User ID
     * @return Available balance
     */
    public BigDecimal getAvailableBalance(Long userId) {
        BigDecimal totalBalance = getTotalBalance(userId);
        BigDecimal allocatedBalance = getAllocatedBalance(userId);
        
        return totalBalance.subtract(allocatedBalance);
    }
    
    /**
     * Adds the specified amount to total balance.
     * 
     * @param userId User ID
     * @param amount Amount to add
     * @return New total balance
     */
    @Transactional
    public BigDecimal addToTotalBalance(Long userId, BigDecimal amount) {
        return userProfileService.addToTotalBalance(userId, amount);
    }
    
    /**
     * Sets a new total balance.
     * 
     * @param userId User ID
     * @param newBalance New total balance
     * @return Updated total balance
     */
    @Transactional
    public BigDecimal updateTotalBalance(Long userId, BigDecimal newBalance) {
        BigDecimal allocatedBalance = getAllocatedBalance(userId);
        
        // Check that new total balance isn't less than allocated balance
        if (newBalance.compareTo(allocatedBalance) < 0) {
            throw new IllegalArgumentException("Total balance cannot be less than allocated balance. " +
                "Allocated: " + allocatedBalance + ", Requested total: " + newBalance);
        }
        
        return userProfileService.updateTotalBalance(userId, newBalance);
    }
} 