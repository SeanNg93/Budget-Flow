package com.financeapp.controller;

import com.financeapp.model.TransactionCategory;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.CategoryService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);

    private final CategoryService categoryService;
    private final UserRepository userRepository;

    @Autowired
    public CategoryController(CategoryService categoryService, UserRepository userRepository) {
        this.categoryService = categoryService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<TransactionCategory>> getAllCategories() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        logger.info("Getting all categories for user: {}", username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOptional.get();
        List<TransactionCategory> categories = categoryService.getAllCategoriesByUserId(user.getId());
        
        logger.info("Found {} categories for user: {}", categories.size(), username);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionCategory> getCategoryById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        logger.info("Getting category with id: {} for user: {}", id, username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            // Check if the category belongs to the authenticated user
            if (!category.getUser().getId().equals(userOptional.get().getId())) {
                logger.error("User {} does not have permission to access category {}", username, id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(category);
        } catch (EntityNotFoundException e) {
            logger.error("Category not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<TransactionCategory> createCategory(@RequestBody TransactionCategory category) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        logger.info("Creating category for user: {}", username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOptional.get();
        
        // Log user roles for debugging
        logger.info("User roles: {}", user.getRoles());
        
        // Allow all authenticated users to create categories
        try {
            TransactionCategory savedCategory = categoryService.createCategory(category, user.getId());
            logger.info("Category created successfully with id: {}", savedCategory.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
        } catch (Exception e) {
            logger.error("Error creating category: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionCategory> updateCategory(@PathVariable Long id, @RequestBody TransactionCategory categoryDetails) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        logger.info("Updating category with id: {} for user: {}", id, username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            // Check if the category belongs to the authenticated user
            if (!category.getUser().getId().equals(userOptional.get().getId())) {
                logger.error("User {} does not have permission to update category {}", username, id);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        logger.info("Deleting category with id: {} for user: {}", id, username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            // Check if the category belongs to the authenticated user
            if (!category.getUser().getId().equals(userOptional.get().getId())) {
                logger.error("User {} does not have permission to delete category {}", username, id);
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

    @GetMapping("/type/{type}")
    public ResponseEntity<List<TransactionCategory>> getCategoriesByType(@PathVariable String type) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        logger.info("Getting categories of type: {} for user: {}", type, username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOptional.get();
        
        try {
            TransactionCategory.CategoryType categoryType = TransactionCategory.CategoryType.valueOf(type.toUpperCase());
            List<TransactionCategory> categories = categoryService.getCategoriesByUserIdAndType(user.getId(), categoryType);
            logger.info("Found {} categories of type {} for user: {}", categories.size(), type, username);
            return ResponseEntity.ok(categories);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid category type: {}", type);
            return ResponseEntity.badRequest().build();
        }
    }
} 