package com.financeapp.repository;

import com.financeapp.model.TransactionCategory;
import com.financeapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionCategoryRepository extends JpaRepository<TransactionCategory, Long> {
    List<TransactionCategory> findByUser(User user);
    List<TransactionCategory> findByUserId(Long userId);
    List<TransactionCategory> findByUserAndType(User user, TransactionCategory.CategoryType type);
    List<TransactionCategory> findByUserIdAndType(Long userId, TransactionCategory.CategoryType type);
} 