package com.financeapp.service;

import com.financeapp.dto.SharedWalletDto;
import com.financeapp.model.SharedWallet;
import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.repository.SharedWalletRepository;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.repository.UserRepository;
import com.financeapp.repository.WalletRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SharedWalletService {

    private static final Logger logger = LoggerFactory.getLogger(SharedWalletService.class);

    private final SharedWalletRepository sharedWalletRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserProfileService userProfileService;
    private final TransactionRepository transactionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public SharedWalletService(SharedWalletRepository sharedWalletRepository, 
                               WalletRepository walletRepository, 
                               UserRepository userRepository,
                               NotificationService notificationService,
                               UserProfileService userProfileService,
                               TransactionRepository transactionRepository) {
        this.sharedWalletRepository = sharedWalletRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.userProfileService = userProfileService;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Share a wallet with another user
     * 
     * @param walletId ID of the wallet to share
     * @param ownerId ID of the user who owns the wallet
     * @param targetUserId ID of the user to share with
     * @return The created shared wallet record
     */
    @Transactional
    public SharedWalletDto shareWallet(Long walletId, Long ownerId, Long targetUserId) {
        logger.info("User {} is sharing wallet {} with user {}", ownerId, walletId, targetUserId);
        
        // Validate that wallet exists and belongs to owner
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + walletId));
        
        if (!wallet.getUser().getId().equals(ownerId)) {
            logger.warn("User {} attempted to share wallet {} which they don't own", ownerId, walletId);
            throw new IllegalArgumentException("You can only share wallets that you own");
        }
        
        if (ownerId.equals(targetUserId)) {
            logger.warn("User {} attempted to share wallet {} with themselves", ownerId, walletId);
            throw new IllegalArgumentException("You cannot share a wallet with yourself");
        }
        
        // Check if the wallet is already shared with this user
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found with id: " + ownerId));
        
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found with id: " + targetUserId));
        
        List<SharedWallet> existingShares = sharedWalletRepository.findByWalletAndSharedWith(wallet, targetUser);
        if (!existingShares.isEmpty()) {
            logger.warn("Wallet {} is already shared with user {}", walletId, targetUserId);
            throw new IllegalArgumentException("This wallet is already shared with this user");
        }
        
        logger.info("Creating shared wallet record for wallet {} between owner {} and user {}", 
                walletId, ownerId, targetUserId);
        
        // Create new shared wallet record
        SharedWallet sharedWallet = SharedWallet.builder()
                .wallet(wallet)
                .owner(owner)
                .sharedWith(targetUser)
                .accepted(false)
                .build();
        
        sharedWallet = sharedWalletRepository.save(sharedWallet);
        
        // Pre-grant transaction visibility to all transactions in the wallet
        // This will ensure that when the user accepts the wallet, they already have visibility
        // to all historical transactions
        logger.info("Pre-granting transaction visibility for all transactions in wallet {} to user {}", 
                walletId, targetUserId);
        grantVisibilityToWalletTransactions(walletId, targetUserId);
        
        // Create notification
        logger.info("Creating wallet sharing notification from user {} to user {}", 
                ownerId, targetUserId);
        notificationService.createWalletSharingNotification(ownerId, targetUserId, wallet.getAccountName());
        
        // Convert to DTO and return
        return mapToDto(sharedWallet);
    }
    
    /**
     * Add transaction visibility for all transactions in a wallet
     * This gives a user access to all existing transactions in a shared wallet
     */
    @Transactional
    public void grantVisibilityToWalletTransactions(Long walletId, Long userId) {
        logger.info("Granting transaction visibility for wallet ID {} to user ID {}", walletId, userId);
        
        // Check how many transactions exist for this wallet
        int transactionCount = transactionRepository.countByWalletId(walletId);
        logger.info("Found {} existing transactions in wallet {}", transactionCount, walletId);
        
        // Execute a native SQL query to add visibility records
        // This is more efficient than fetching all transactions and adding visibility one by one
        int insertCount = entityManager.createNativeQuery(
            "INSERT IGNORE INTO transaction_visibility (transaction_id, user_id, is_creator, created_at) " +
            "SELECT t.id, :userId, FALSE, NOW() " +
            "FROM transactions t " +
            "WHERE t.account_id = :walletId " +
            "AND NOT EXISTS (" +
            "   SELECT 1 FROM transaction_visibility tv " +
            "   WHERE tv.transaction_id = t.id AND tv.user_id = :userId" +
            ")"
        )
        .setParameter("walletId", walletId)
        .setParameter("userId", userId)
        .executeUpdate();
        
        logger.info("Added visibility for {} transactions to user {}", insertCount, userId);
        
        // For debugging purposes, verify the transaction visibility was granted correctly
        List<Long> visibleTransactionIds = entityManager.createQuery(
            "SELECT t.id FROM Transaction t JOIN TransactionVisibility tv ON t.id = tv.transaction.id " +
            "WHERE t.wallet.id = :walletId AND tv.user.id = :userId", Long.class)
            .setParameter("walletId", walletId)
            .setParameter("userId", userId)
            .getResultList();
            
        logger.info("After granting visibility, user {} can see {} transactions in wallet {}: {}",
            userId, visibleTransactionIds.size(), walletId, visibleTransactionIds);
    }

    /**
     * Accept a shared wallet
     * 
     * @param sharedWalletId ID of the shared wallet
     * @param userId ID of the user accepting the wallet
     * @return The updated shared wallet record
     */
    @Transactional
    public SharedWalletDto acceptSharedWallet(Long sharedWalletId, Long userId) {
        logger.info("User {} is accepting shared wallet {}", userId, sharedWalletId);
        
        SharedWallet sharedWallet = sharedWalletRepository.findById(sharedWalletId)
                .orElseThrow(() -> new RuntimeException("Shared wallet not found with id: " + sharedWalletId));
        
        if (!sharedWallet.getSharedWith().getId().equals(userId)) {
            logger.warn("User {} attempted to accept wallet {} that was not shared with them", userId, sharedWalletId);
            throw new IllegalArgumentException("You can only accept wallets shared with you");
        }
        
        // Check if already accepted
        if (sharedWallet.isAccepted()) {
            logger.info("Wallet {} was already accepted by user {}", sharedWalletId, userId);
            return mapToDto(sharedWallet);
        }
        
        logger.info("Setting wallet {} as accepted by user {}", sharedWalletId, userId);
        sharedWallet.setAccepted(true);
        sharedWallet = sharedWalletRepository.save(sharedWallet);
        
        Long walletId = sharedWallet.getWallet().getId();
        logger.info("Granting historical transaction access for wallet {} to user {}", walletId, userId);
        
        // Grant visibility to all existing transactions in the wallet
        grantVisibilityToWalletTransactions(walletId, userId);
        
        // Create notification
        logger.info("Creating wallet accepted notification from user {} to user {}", 
                userId, sharedWallet.getOwner().getId());
        notificationService.createWalletAcceptedNotification(
            sharedWallet.getOwner().getId(), 
            userId, 
            sharedWallet.getWallet().getAccountName()
        );
        
        return mapToDto(sharedWallet);
    }
    
    /**
     * Get all wallets shared with a user
     * 
     * @param userId ID of the user
     * @return List of shared wallets
     */
    public List<SharedWalletDto> getWalletsSharedWithUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<SharedWallet> sharedWallets = sharedWalletRepository.findBySharedWith(user);
        
        return sharedWallets.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all wallets shared by a user
     * 
     * @param userId ID of the user
     * @return List of shared wallets
     */
    public List<SharedWalletDto> getWalletsSharedByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<SharedWallet> sharedWallets = sharedWalletRepository.findByOwner(user);
        
        return sharedWallets.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all accepted wallets shared with a user
     * 
     * @param userId ID of the user
     * @return List of accepted shared wallets
     */
    public List<SharedWalletDto> getAcceptedWalletsSharedWithUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<SharedWallet> sharedWallets = sharedWalletRepository.findBySharedWithAndAccepted(user, true);
        
        return sharedWallets.stream()
                .map(this::mapToDto)
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
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + walletId));
        
        // Check if user is the owner
        if (wallet.getUser().getId().equals(userId)) {
            return true;
        }
        
        // Check if wallet is shared with user and accepted
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Optional<SharedWallet> sharedWallet = sharedWalletRepository.findByWalletAndSharedWithAndAccepted(wallet, user, true);
        
        return sharedWallet.isPresent();
    }
    
    /**
     * Removes a shared wallet relationship.
     * If the user is the owner, the sharing relationship is removed.
     * If the user is a recipient, the sharing relationship is removed from their view.
     *
     * @param sharedWalletId The ID of the shared wallet to remove
     * @param userId The ID of the user who wants to remove the shared wallet
     * @throws IllegalArgumentException if the user has no permission to remove the shared wallet
     */
    @Transactional
    public void removeSharedWallet(Long sharedWalletId, Long userId) {
        SharedWallet sharedWallet = sharedWalletRepository.findById(sharedWalletId)
                .orElseThrow(() -> new IllegalArgumentException("Shared wallet not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if the user is the owner or the recipient of the shared wallet
        if (sharedWallet.getOwner().getId().equals(userId) || 
            sharedWallet.getSharedWith().getId().equals(userId)) {
            
            // Remove the shared wallet relationship only, not the actual wallet
            sharedWalletRepository.delete(sharedWallet);
        } else {
            throw new IllegalArgumentException("You do not have permission to remove this shared wallet");
        }
    }
    
    /**
     * Map SharedWallet entity to SharedWalletDto
     */
    private SharedWalletDto mapToDto(SharedWallet sharedWallet) {
        String ownerProfilePictureUrl = null;
        String sharedWithProfilePictureUrl = null;
        try {
            ownerProfilePictureUrl = userProfileService.getUserProfileByUsername(sharedWallet.getOwner().getUsername()).getProfilePictureUrl();
        } catch (Exception e) {
            // leave as null if not available
        }
        try {
            sharedWithProfilePictureUrl = userProfileService.getUserProfileByUsername(sharedWallet.getSharedWith().getUsername()).getProfilePictureUrl();
        } catch (Exception e) {
            // leave as null if not available
        }

        return SharedWalletDto.builder()
                .id(sharedWallet.getId())
                .walletId(sharedWallet.getWallet().getId())
                .walletName(sharedWallet.getWallet().getAccountName())
                .ownerId(sharedWallet.getOwner().getId())
                .ownerUsername(sharedWallet.getOwner().getUsername())
                .ownerProfilePictureUrl(ownerProfilePictureUrl)
                .sharedWithId(sharedWallet.getSharedWith().getId())
                .sharedWithUsername(sharedWallet.getSharedWith().getUsername())
                .sharedWithProfilePictureUrl(sharedWithProfilePictureUrl)
                .accepted(sharedWallet.isAccepted())
                .createdAt(sharedWallet.getCreatedAt())
                .build();
    }
} 