package com.financeapp.repository;

import com.financeapp.model.Wallet;
import com.financeapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUser(User user);

    Optional<Wallet> findByIdAndUser(Long id, User user);
    
}

