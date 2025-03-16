package com.financeapp.repository;

import com.financeapp.model.Wallet;
import com.financeapp.model.Transaction;
import com.financeapp.model.Transaction.TransactionType;
import com.financeapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUser(User user);
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByWallet(Wallet wallet);
    List<Transaction> findByWalletId(Long walletId);
    
    List<Transaction> findByUserAndTransactionDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.transactionType = 'INCOME'")
    BigDecimal getTotalIncome(@Param("user") User user);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.transactionType = 'EXPENSE'")
    BigDecimal getTotalExpense(@Param("user") User user);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.transactionType = 'INCOME'")
    BigDecimal getTotalIncomeByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.transactionType = 'EXPENSE'")
    BigDecimal getTotalExpenseByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.transactionType = 'INCOME' AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalIncomeByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.transactionType = 'EXPENSE' AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalExpenseByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
} 