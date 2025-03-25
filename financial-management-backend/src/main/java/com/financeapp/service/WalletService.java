package com.financeapp.service;

import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.model.UserProfile;
import com.financeapp.repository.UserRepository;
import com.financeapp.repository.WalletRepository;
import com.financeapp.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.financeapp.service.NotificationService;
import java.util.ArrayList;
import com.financeapp.model.SharedWallet;
import com.financeapp.repository.SharedWalletRepository;
import com.financeapp.service.WalletAccessService;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
    private final UserProfileRepository userProfileRepository;
    private final NotificationService notificationService;
    private final SharedWalletRepository sharedWalletRepository;
    private final WalletAccessService walletAccessService;

    @Autowired
    public WalletService(
            WalletRepository walletRepository, 
            UserRepository userRepository, 
            UserProfileService userProfileService, 
            UserProfileRepository userProfileRepository, 
            NotificationService notificationService, 
            SharedWalletRepository sharedWalletRepository,
            WalletAccessService walletAccessService) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.userProfileService = userProfileService;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
        this.sharedWalletRepository = sharedWalletRepository;
        this.walletAccessService = walletAccessService;
    }

    public List<Wallet> getAllWalletsByUserId(Long userId) {
        List<Wallet> wallets = new ArrayList<>();
        
        // Get user's own wallets
        wallets.addAll(walletRepository.findByUserId(userId));
        
        // Get shared wallets that have been accepted
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<SharedWallet> sharedWallets = sharedWalletRepository.findBySharedWithAndAccepted(user, true);
        
        // Add the actual wallet objects from shared wallets
        for (SharedWallet sharedWallet : sharedWallets) {
            wallets.add(sharedWallet.getWallet());
        }
        
        // If user has no wallets (including shared ones), create a default one
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
    public void deleteWallet(Long id, Long userId) {
        Wallet wallet = getWalletById(id);
        
        // Check if the user is the owner of the wallet
        if (!wallet.getUser().getId().equals(userId)) {
            // If not the owner, check if the wallet is shared with this user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            // Find the shared wallet relationship
            List<SharedWallet> sharedWallets = sharedWalletRepository.findByWalletAndSharedWith(wallet, user);
            
            if (sharedWallets.isEmpty()) {
                throw new IllegalArgumentException("You don't have permission to delete this wallet");
            }
            
            // Remove the shared wallet relationship instead of deleting the actual wallet
            sharedWalletRepository.deleteAll(sharedWallets);
            return;
        }
        
        // If the user is the owner, delete the wallet
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

    /**
     * Transfers money from one user's wallet to another user's total balance.
     *
     * @param sourceUserId User ID of the sender
     * @param sourceWalletId Wallet ID of the source wallet
     * @param targetUserId User ID of the recipient
     * @param amount Amount to transfer
     * @return Map containing updated source wallet balance and both users' total balances
     * @throws RuntimeException if users or wallet not found, or insufficient funds
     */
    @Transactional
    public Map<String, Object> transferToUser(Long sourceUserId, Long sourceWalletId, Long targetUserId, BigDecimal amount) {
        // Validate inputs
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }
        
        if (sourceUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot transfer to yourself");
        }
        
        // Get source wallet
        Wallet sourceWallet = walletRepository.findById(sourceWalletId)
                .orElseThrow(() -> new RuntimeException("Source wallet not found with id: " + sourceWalletId));
        
        // Verify the wallet belongs to the source user
        if (!sourceWallet.getUser().getId().equals(sourceUserId)) {
            throw new IllegalArgumentException("Source wallet does not belong to the user");
        }
        
        // Check if there are sufficient funds
        if (sourceWallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient funds in the source wallet");
        }
        
        // Get target user
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found with id: " + targetUserId));
        
        // Subtract from source wallet
        BigDecimal newSourceBalance = sourceWallet.getBalance().subtract(amount);
        sourceWallet.setBalance(newSourceBalance);
        walletRepository.save(sourceWallet);
        
        // Update source user's total balance (decrease it)
        BigDecimal newSourceTotalBalance = userProfileService.updateTotalBalance(sourceUserId, 
            getTotalBalance(sourceUserId).subtract(amount));
        
        // Add to target user's total balance
        BigDecimal newTargetTotalBalance = userProfileService.addToTotalBalance(targetUserId, amount);
        
        // Create notifications for both users
        notificationService.createMoneyTransferNotifications(
            sourceUserId, 
            targetUserId, 
            amount.toString(), 
            sourceWallet.getAccountName()
        );
        
        // Create response with updated balances
        Map<String, Object> result = new HashMap<>();
        result.put("sourceWalletBalance", newSourceBalance);
        result.put("sourceTotalBalance", newSourceTotalBalance);
        result.put("targetTotalBalance", newTargetTotalBalance);
        result.put("targetUsername", targetUser.getUsername());
        
        return result;
    }

    /**
     * Find a user by username or full name. Used for user transfer functionality.
     * 
     * @param query The username or full name to search for
     * @return List of matching users with basic info
     */
    public List<Map<String, Object>> findUsersByQuery(String query, Long currentUserId) {
        // Find users by username
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query);
        
        return users.stream()
                .filter(user -> !user.getId().equals(currentUserId)) // Exclude current user
                .map(user -> {
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", user.getId());
                    userInfo.put("username", user.getUsername());
                    
                    // Get user profile from repository
                    Optional<UserProfile> userProfileOpt = userProfileRepository.findByUserId(user.getId());
                    if (userProfileOpt.isPresent()) {
                        UserProfile userProfile = userProfileOpt.get();
                        userInfo.put("fullName", userProfile.getFullName());
                        userInfo.put("profilePicture", userProfile.getProfilePicturePath());
                    }
                    
                    return userInfo;
                })
                .collect(Collectors.toList());
    }

    /**
     * Check if a user has access to a wallet (either as owner or shared)
     * 
     * @param walletId ID of the wallet
     * @param userId ID of the user
     * @return true if the user has access, false otherwise
     */
    public boolean hasAccessToWallet(Long walletId, Long userId) {
        // Delegate to WalletAccessService
        return walletAccessService.hasAccessToWallet(walletId, userId);
    }
} 