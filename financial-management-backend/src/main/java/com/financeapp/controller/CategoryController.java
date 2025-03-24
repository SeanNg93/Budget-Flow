package com.financeapp.controller;

import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionCategory;
import com.financeapp.model.User;
import com.financeapp.service.CategoryService;
import com.financeapp.service.TransactionService;
import com.financeapp.utils.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for managing transaction categories
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);

    private final CategoryService categoryService;
    private final TransactionService transactionService;
    private final SecurityUtils securityUtils;

    /**
     * Get all categories for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<TransactionCategory>> getAllCategories() {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        List<TransactionCategory> categories = categoryService.getAllCategoriesByUserId(user.getId());
        
        logger.info("Found {} categories for user: {}", categories.size(), user.getUsername());
        return ResponseEntity.ok(categories);
    }

    /**
     * Get a category by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransactionCategory> getCategoryById(@PathVariable Long id) {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            if (!isOwner(category, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(category);
        } catch (EntityNotFoundException e) {
            logger.error("Category not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new category
     */
    @PostMapping
    public ResponseEntity<TransactionCategory> createCategory(@RequestBody TransactionCategory category) {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory savedCategory = categoryService.createCategory(category, user.getId());
            logger.info("Category created successfully with id: {}", savedCategory.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
        } catch (Exception e) {
            logger.error("Error creating category: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing category
     */
    @PutMapping("/{id}")
    public ResponseEntity<TransactionCategory> updateCategory(@PathVariable Long id, @RequestBody TransactionCategory categoryDetails) {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            if (!isOwner(category, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            TransactionCategory updatedCategory = categoryService.updateCategory(id, categoryDetails);
            logger.info("Category updated successfully with id: {}", updatedCategory.getId());
            return ResponseEntity.ok(updatedCategory);
        } catch (EntityNotFoundException e) {
            logger.error("Category not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a category
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            if (!isOwner(category, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            categoryService.deleteCategory(id);
            logger.info("Category deleted successfully with id: {}", id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            logger.error("Category not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get categories by type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<TransactionCategory>> getCategoriesByType(@PathVariable String type) {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory.CategoryType categoryType = TransactionCategory.CategoryType.valueOf(type.toUpperCase());
            List<TransactionCategory> categories = categoryService.getCategoriesByUserIdAndType(user.getId(), categoryType);
            logger.info("Found {} categories of type {} for user: {}", categories.size(), type, user.getUsername());
            return ResponseEntity.ok(categories);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid category type: {}", type);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get spending progress for a specific category
     */
    @GetMapping("/{id}/spending-progress")
    public ResponseEntity<Map<String, Object>> getCategorySpendingProgress(@PathVariable Long id) {
        User user = securityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            if (!isOwner(category, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Only process for expense categories with spending limits
            if (category.getType() != TransactionCategory.CategoryType.EXPENSE || category.getSpendingLimit() == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Get all transactions for this category
            List<Transaction> transactions = transactionService.getTransactionsByCategoryId(id);
            
            // Calculate total spent
            BigDecimal totalSpent = transactions.stream()
                .filter(t -> t.getTransactionType() == Transaction.TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Calculate percentage of limit spent
            BigDecimal limit = category.getSpendingLimit();
            BigDecimal percentage = limit.compareTo(BigDecimal.ZERO) > 0 
                ? totalSpent.multiply(new BigDecimal("100")).divide(limit, 2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;
            
            // Calculate warning threshold
            int warningPercentage = category.getWarningPercentage() != null ? category.getWarningPercentage() : 80;
            BigDecimal warningThreshold = limit.multiply(new BigDecimal(warningPercentage)).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalSpent", totalSpent);
            result.put("limit", limit);
            result.put("percentage", percentage);
            result.put("warningThreshold", warningThreshold);
            result.put("warningPercentage", warningPercentage);
            
            return ResponseEntity.ok(result);
        } catch (EntityNotFoundException e) {
            logger.error("Category not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Check if the user is the owner of the category
     */
    private boolean isOwner(TransactionCategory category, User user) {
        if (!category.getUser().getId().equals(user.getId())) {
            logger.error("User {} does not have permission to access category {}", user.getUsername(), category.getId());
            return false;
        }
        return true;
    }
} 