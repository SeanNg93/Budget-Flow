package com.financeapp.service;

import com.financeapp.dto.SharedWalletDto;
import com.financeapp.model.SharedWallet;
import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import com.financeapp.repository.SharedWalletRepository;
import com.financeapp.repository.UserRepository;
import com.financeapp.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SharedWalletService {

    private final SharedWalletRepository sharedWalletRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public SharedWalletService(SharedWalletRepository sharedWalletRepository, 
                               WalletRepository walletRepository, 
                               UserRepository userRepository,
                               NotificationService notificationService) {
        this.sharedWalletRepository = sharedWalletRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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
        // Validate that wallet exists and belongs to owner
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + walletId));
        
        if (!wallet.getUser().getId().equals(ownerId)) {
            throw new IllegalArgumentException("You can only share wallets that you own");
        }
        
        if (ownerId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot share a wallet with yourself");
        }
        
        // Check if the wallet is already shared with this user
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found with id: " + ownerId));
        
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found with id: " + targetUserId));
        
        List<SharedWallet> existingShares = sharedWalletRepository.findByWalletAndSharedWith(wallet, targetUser);
        if (!existingShares.isEmpty()) {
            throw new IllegalArgumentException("This wallet is already shared with this user");
        }
        
        // Create new shared wallet record
        SharedWallet sharedWallet = SharedWallet.builder()
                .wallet(wallet)
                .owner(owner)
                .sharedWith(targetUser)
                .accepted(false)
                .build();
        
        sharedWallet = sharedWalletRepository.save(sharedWallet);
        
        // Create notification
        notificationService.createWalletSharingNotification(ownerId, targetUserId, wallet.getAccountName());
        
        // Convert to DTO and return
        return mapToDto(sharedWallet);
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
        SharedWallet sharedWallet = sharedWalletRepository.findById(sharedWalletId)
                .orElseThrow(() -> new RuntimeException("Shared wallet not found with id: " + sharedWalletId));
        
        if (!sharedWallet.getSharedWith().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only accept wallets shared with you");
        }
        
        sharedWallet.setAccepted(true);
        sharedWallet = sharedWalletRepository.save(sharedWallet);
        
        // Create notification
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
     * Remove a shared wallet
     * 
     * @param sharedWalletId ID of the shared wallet
     * @param userId ID of the user removing the share (must be owner or shared user)
     */
    @Transactional
    public void removeSharedWallet(Long sharedWalletId, Long userId) {
        SharedWallet sharedWallet = sharedWalletRepository.findById(sharedWalletId)
                .orElseThrow(() -> new RuntimeException("Shared wallet not found with id: " + sharedWalletId));
        
        // Verify user has rights to remove the share
        boolean isOwner = sharedWallet.getOwner().getId().equals(userId);
        boolean isSharedWith = sharedWallet.getSharedWith().getId().equals(userId);
        
        if (!isOwner && !isSharedWith) {
            throw new IllegalArgumentException("You do not have permission to remove this shared wallet");
        }
        
        sharedWalletRepository.delete(sharedWallet);
    }
    
    /**
     * Map SharedWallet entity to SharedWalletDto
     */
    private SharedWalletDto mapToDto(SharedWallet sharedWallet) {
        return SharedWalletDto.builder()
                .id(sharedWallet.getId())
                .walletId(sharedWallet.getWallet().getId())
                .walletName(sharedWallet.getWallet().getAccountName())
                .ownerId(sharedWallet.getOwner().getId())
                .ownerUsername(sharedWallet.getOwner().getUsername())
                .sharedWithId(sharedWallet.getSharedWith().getId())
                .sharedWithUsername(sharedWallet.getSharedWith().getUsername())
                .accepted(sharedWallet.isAccepted())
                .createdAt(sharedWallet.getCreatedAt())
                .build();
    }
} 