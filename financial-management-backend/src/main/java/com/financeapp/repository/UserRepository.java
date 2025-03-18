package com.financeapp.repository;

import com.financeapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByResetPasswordToken(String token);
    Optional<User> findByActivationToken(String token);
    
    // Methods for soft delete functionality
    List<User> findByIsPendingDeletionTrue();
    
    @Query("SELECT u FROM User u WHERE u.isPendingDeletion = true AND u.deletionRequestedAt < ?1")
    List<User> findUsersToDelete(LocalDateTime cutoffTime);
    
    // Method to search users by username for user transfers
    List<User> findByUsernameContainingIgnoreCase(String username);
}