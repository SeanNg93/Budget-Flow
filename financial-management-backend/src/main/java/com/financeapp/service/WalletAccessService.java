package com.financeapp.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service that checks wallet access permissions separately from both Wallet and SharedWallet services
 * to avoid circular dependencies.
 */
@Service
public class WalletAccessService {

    private final EntityManager entityManager;

    @Autowired
    public WalletAccessService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * Check if a user has access to a wallet (either as owner or shared)
     * 
     * @param walletId ID of the wallet
     * @param userId ID of the user
     * @return true if the user has access, false otherwise
     */
    public boolean hasAccessToWallet(Long walletId, Long userId) {
        // Using a native query to avoid service circular dependencies
        Query query = entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM (" +
            "   SELECT id FROM wallets WHERE id = :walletId AND user_id = :userId " +
            "   UNION " +
            "   SELECT w.id FROM wallets w " +
            "   JOIN shared_wallets sw ON w.id = sw.wallet_id " +
            "   WHERE w.id = :walletId AND sw.shared_with_id = :userId AND sw.accepted = true" +
            ") as access_check"
        );
        query.setParameter("walletId", walletId);
        query.setParameter("userId", userId);
        
        Number count = (Number) query.getSingleResult();
        return count.intValue() > 0;
    }
} 