package com.financeapp.controller;

import com.financeapp.model.TransactionCategory;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.CategoryService;
import jakarta.persistence.EntityNotFoundException;
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
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOptional.get();
        List<TransactionCategory> categories = categoryService.getAllCategoriesByUserId(user.getId());
        
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionCategory> getCategoryById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            // Check if the category belongs to the authenticated user
            if (!category.getUser().getId().equals(userOptional.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(category);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<TransactionCategory> createCategory(@RequestBody TransactionCategory category) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOptional.get();
        TransactionCategory savedCategory = categoryService.createCategory(category, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionCategory> updateCategory(@PathVariable Long id, @RequestBody TransactionCategory categoryDetails) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            // Check if the category belongs to the authenticated user
            if (!category.getUser().getId().equals(userOptional.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            TransactionCategory updatedCategory = categoryService.updateCategory(id, categoryDetails);
            return ResponseEntity.ok(updatedCategory);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            TransactionCategory category = categoryService.getCategoryById(id);
            
            // Check if the category belongs to the authenticated user
            if (!category.getUser().getId().equals(userOptional.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            categoryService.deleteCategory(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<TransactionCategory>> getCategoriesByType(@PathVariable String type) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = userOptional.get();
        
        try {
            TransactionCategory.CategoryType categoryType = TransactionCategory.CategoryType.valueOf(type.toUpperCase());
            List<TransactionCategory> categories = categoryService.getCategoriesByUserIdAndType(user.getId(), categoryType);
            return ResponseEntity.ok(categories);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 