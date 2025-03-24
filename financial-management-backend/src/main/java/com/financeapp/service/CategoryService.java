package com.financeapp.service;

import com.financeapp.model.TransactionCategory;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionCategoryRepository;
import com.financeapp.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final TransactionCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Autowired
    public CategoryService(TransactionCategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<TransactionCategory> getAllCategoriesByUserId(Long userId) {
        return categoryRepository.findByUserId(userId);
    }

    public List<TransactionCategory> getCategoriesByUserIdAndType(Long userId, TransactionCategory.CategoryType type) {
        return categoryRepository.findByUserIdAndType(userId, type);
    }

    public TransactionCategory getCategoryById(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + categoryId));
    }

    @Transactional
    public TransactionCategory createCategory(TransactionCategory category, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        category.setUser(user);
        return categoryRepository.save(category);
    }

    @Transactional
    public TransactionCategory updateCategory(Long categoryId, TransactionCategory categoryDetails) {
        TransactionCategory category = getCategoryById(categoryId);
        category.setCategoryName(categoryDetails.getCategoryName());
        category.setType(categoryDetails.getType());
        
        // Update the new fields if provided
        if (categoryDetails.getSpendingLimit() != null) {
            category.setSpendingLimit(categoryDetails.getSpendingLimit());
        }
        
        if (categoryDetails.getWarningPercentage() != null) {
            category.setWarningPercentage(categoryDetails.getWarningPercentage());
        }
        
        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        TransactionCategory category = getCategoryById(categoryId);
        categoryRepository.delete(category);
    }
} 