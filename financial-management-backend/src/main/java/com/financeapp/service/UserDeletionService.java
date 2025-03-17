package com.financeapp.service;

import com.financeapp.model.DeletedUser;
import com.financeapp.model.User;
import com.financeapp.model.UserProfile;
import com.financeapp.model.Wallet;
import com.financeapp.repository.DeletedUserRepository;
import com.financeapp.repository.UserProfileRepository;
import com.financeapp.repository.UserRepository;
import com.financeapp.repository.WalletRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDeletionService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final WalletRepository walletRepository;
    private final DeletedUserRepository deletedUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    
    /**
     * Request account deletion with a 30-minute grace period
     * @param username the username of the user requesting deletion
     * @param password the password for verification
     * @param isSelfDelete whether the deletion was requested by the user themselves
     * @return a map containing success status and message
     */
    @Transactional
    public Map<String, String> requestAccountDeletion(String username, String password, boolean isSelfDelete) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return Map.of(
                "success", "false", 
                "message", "User not found"
            );
        }
        
        User user = userOpt.get();
        
        // Verify password if it's a self-delete
        if (isSelfDelete && !passwordEncoder.matches(password, user.getPassword())) {
            return Map.of(
                "success", "false", 
                "message", "Incorrect password"
            );
        }
        
        // Mark user for deletion
        user.setPendingDeletion(true);
        user.setDeletionRequestedAt(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("User {} marked for deletion. Will be deleted after 30 minutes if not cancelled.", username);
        
        return Map.of(
            "success", "true", 
            "message", "Account marked for deletion. You have 30 minutes to log back in if you change your mind."
        );
    }
    
    /**
     * Cancel a pending account deletion
     * @param username the username of the user
     * @return a map containing success status and message
     */
    @Transactional
    public Map<String, String> cancelAccountDeletion(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return Map.of(
                "success", "false", 
                "message", "User not found"
            );
        }
        
        User user = userOpt.get();
        
        if (!user.isPendingDeletion()) {
            return Map.of(
                "success", "false", 
                "message", "No pending deletion found for this account"
            );
        }
        
        // Cancel deletion
        user.setPendingDeletion(false);
        user.setDeletionRequestedAt(null);
        userRepository.save(user);
        
        log.info("Deletion cancelled for user {}", username);
        
        return Map.of(
            "success", "true", 
            "message", "Account deletion has been cancelled"
        );
    }
    
    /**
     * Scheduled task to process users marked for deletion after the 30-minute grace period
     */
    @Scheduled(fixedRate = 300000) // Run every 5 minutes (300,000 ms)
    @Transactional
    public void processUserDeletions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(30);
        List<User> usersToDelete = userRepository.findUsersToDelete(cutoffTime);
        
        log.info("Found {} users to delete after 30-minute grace period", usersToDelete.size());
        
        for (User user : usersToDelete) {
            try {
                finalizeUserDeletion(user);
                log.info("Successfully processed deletion for user: {}", user.getUsername());
            } catch (Exception e) {
                log.error("Error processing deletion for user {}: {}", user.getUsername(), e.getMessage(), e);
            }
        }
    }
    
    /**
     * Finalize the deletion of a user by moving their data to the deleted_users table
     * @param user the user to delete
     */
    @Transactional
    public void finalizeUserDeletion(User user) {
        try {
            // Get user profile
            Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(user.getId());
            
            // Create deleted user record
            DeletedUser deletedUser = new DeletedUser();
            deletedUser.setOriginalUserId(user.getId());
            deletedUser.setUsername(user.getUsername());
            deletedUser.setEmail(user.getEmail());
            deletedUser.setPasswordHash(user.getPassword());
            deletedUser.setDeletedAt(LocalDateTime.now());
            deletedUser.setSelfDelete(true); // Assuming self-delete by default
            
            // Add profile data if available
            if (profileOpt.isPresent()) {
                UserProfile profile = profileOpt.get();
                deletedUser.setFullName(profile.getFullName());
                deletedUser.setPhone(profile.getPhone());
                deletedUser.setBio(profile.getBio());
                deletedUser.setProfilePicturePath(profile.getProfilePicturePath());
                deletedUser.setRole(profile.getRole());
                deletedUser.setTotalBalance(profile.getTotalBalance());
                deletedUser.setCurrency(profile.getCurrency());
            }
            
            // Get user's wallets and store as JSON
            List<Wallet> wallets = walletRepository.findByUserId(user.getId());
            Map<String, Object> userData = new HashMap<>();
            userData.put("wallets", wallets);
            
            // Convert to JSON
            try {
                deletedUser.setUserData(objectMapper.writeValueAsString(userData));
            } catch (Exception e) {
                log.error("Error serializing user data to JSON", e);
                deletedUser.setUserData("{}");
            }
            
            // Save deleted user record
            deletedUserRepository.save(deletedUser);
            
            // Delete the original user (this will cascade to related entities)
            userRepository.delete(user);
            
            log.info("User {} has been moved to deleted_users table and removed from active users", user.getUsername());
        } catch (Exception e) {
            log.error("Error finalizing user deletion", e);
            throw e;
        }
    }
    
    /**
     * Check if a user is pending deletion
     * @param username the username to check
     * @return true if the user is pending deletion, false otherwise
     */
    public boolean isUserPendingDeletion(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        return userOpt.map(User::isPendingDeletion).orElse(false);
    }
} 