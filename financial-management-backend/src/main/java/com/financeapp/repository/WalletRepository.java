package com.financeapp.repository;

import com.financeapp.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);
    
    @Modifying
    @Query("DELETE FROM Wallet w WHERE w.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
} 