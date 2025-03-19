package com.financeapp.repository;

import com.financeapp.model.SharedWallet;
import com.financeapp.model.User;
import com.financeapp.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedWalletRepository extends JpaRepository<SharedWallet, Long> {
    List<SharedWallet> findBySharedWith(User sharedWith);
    
    List<SharedWallet> findByOwner(User owner);
    
    List<SharedWallet> findByWalletAndSharedWith(Wallet wallet, User sharedWith);
    
    List<SharedWallet> findByWalletAndOwner(Wallet wallet, User owner);
    
    List<SharedWallet> findBySharedWithAndAccepted(User sharedWith, boolean accepted);
    
    Optional<SharedWallet> findByWalletAndSharedWithAndAccepted(Wallet wallet, User sharedWith, boolean accepted);
} 