package com.financeapp.repository;

import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionVisibility;
import com.financeapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionVisibilityRepository extends JpaRepository<TransactionVisibility, Long> {
    List<TransactionVisibility> findByUser(User user);
    List<TransactionVisibility> findByUserId(Long userId);
    List<TransactionVisibility> findByTransaction(Transaction transaction);
    List<TransactionVisibility> findByTransactionId(Long transactionId);
    
    @Query("SELECT tv.transaction.id FROM TransactionVisibility tv WHERE tv.user.id = :userId")
    List<Long> findTransactionIdsByUserId(@Param("userId") Long userId);
    
    boolean existsByTransactionIdAndUserId(Long transactionId, Long userId);
} 