package com.financeapp.repository;

import com.financeapp.model.TransactionCategory;
import com.financeapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionCategoryRepository extends JpaRepository<TransactionCategory, Long> {
    List<TransactionCategory> findByUser(User user);
    List<TransactionCategory> findByUserId(Long userId);
    List<TransactionCategory> findByUserAndType(User user, TransactionCategory.CategoryType type);
    List<TransactionCategory> findByUserIdAndType(Long userId, TransactionCategory.CategoryType type);
    
    @Modifying
    @Query("DELETE FROM TransactionCategory c WHERE c.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
} 