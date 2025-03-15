package com.financeapp.utils;

import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Utility class for security-related operations
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Get the current authenticated user
     * @return the authenticated user or null if not found
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        log.debug("Getting current user: {}", username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            log.error("User not found: {}", username);
            return null;
        }
        
        return userOptional.get();
    }
    
    /**
     * Get the current authenticated username
     * @return the authenticated username
     */
    public String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
    
    /**
     * Check if the current user has admin role
     * @return true if the user has admin role, false otherwise
     */
    public boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
    
    /**
     * Check if the current user is the owner of the given user ID
     * @param userId the user ID to check
     * @return true if the current user is the owner, false otherwise
     */
    public boolean isCurrentUserOrAdmin(Long userId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        return currentUser.getId().equals(userId) || isCurrentUserAdmin();
    }
    
    /**
     * Get user ID from username
     * @param username the username
     * @return the user ID
     * @throws RuntimeException if the user is not found
     */
    public Long getUserIdFromUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            log.error("User not found with username: {}", username);
            throw new RuntimeException("User not found with username: " + username);
        }
        return userOptional.get().getId();
    }
} 