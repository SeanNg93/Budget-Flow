package com.financeapp.controller;

import com.financeapp.dto.NotificationDto;
import com.financeapp.dto.SystemNotificationRequest;
import com.financeapp.model.User;
import com.financeapp.model.UserProfile;
import com.financeapp.repository.UserProfileRepository;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller for handling notification-related endpoints
 */
@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Autowired
    public NotificationController(NotificationService notificationService, 
                                 UserRepository userRepository,
                                 UserProfileRepository userProfileRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Get all notifications for the authenticated user
     * @return List of notification DTOs or empty list
     */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUserNotifications() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to notifications endpoint");
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            List<NotificationDto> notifications = notificationService.getUserNotifications(userId);
            logger.debug("Retrieved {} notifications for user {}", notifications.size(), username);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Error retrieving notifications", e);
            // Return an empty list for better UX
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Get unread notifications for the authenticated user
     * @return List of unread notification DTOs or empty list
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to unread notifications endpoint");
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            List<NotificationDto> notifications = notificationService.getUnreadNotifications(userId);
            logger.debug("Retrieved {} unread notifications for user {}", notifications.size(), username);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Error retrieving unread notifications", e);
            // Return an empty list for better UX
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Get count of unread notifications for the authenticated user
     * @return Map containing the unread notification count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to notification count endpoint");
                return ResponseEntity.status(401).build();
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            long count = notificationService.countUnreadNotifications(userId);
            logger.debug("Unread notification count for user {}: {}", username, count);
            
            Map<String, Long> response = new HashMap<>();
            response.put("unreadCount", count);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving unread notification count", e);
            
            // Create a user-friendly response
            Map<String, Long> response = new HashMap<>();
            response.put("unreadCount", 0L);
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Mark a specific notification as read
     * @param id the notification ID
     * @return The updated notification DTO
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            // Verify ownership of notification before marking as read
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to mark notification as read");
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            
            NotificationDto notification = notificationService.markAsRead(id);
            logger.debug("Marked notification {} as read", id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            logger.error("Error marking notification as read: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to mark notification as read",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Mark all notifications for the authenticated user as read
     * @return Success response
     */
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to mark all notifications as read");
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            notificationService.markAllAsRead(userId);
            logger.debug("Marked all notifications as read for user {}", username);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error marking all notifications as read: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to mark all notifications as read",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Delete all notifications for the authenticated user
     * @return Success response
     */
    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllNotifications() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to delete all notifications");
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            
            String username = auth.getName();
            Long userId = getUserIdFromUsername(username);
            
            notificationService.deleteAllNotifications(userId);
            logger.debug("Deleted all notifications for user {}", username);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error deleting all notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to delete all notifications",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Admin endpoint to send system notifications to all users or a specific user
     * @param request the system notification request
     * @return Success response or error
     */
    @PostMapping("/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> sendSystemNotification(@RequestBody SystemNotificationRequest request) {
        try {
            // Validate request
            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Notification message cannot be empty"
                ));
            }
            
            if (request.getType() == null || request.getType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Notification type cannot be empty"
                ));
            }
            
            // Verify current user is an admin
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthenticated access attempt to send system notification");
                return ResponseEntity.status(401).body(Map.of(
                    "success", "false", 
                    "message", "Not authenticated"
                ));
            }
            
            String username = auth.getName();
            Long adminId = getUserIdFromUsername(username);
            
            // Verify user is admin through user profile
            Optional<UserProfile> adminProfile = userProfileRepository.findByUserId(adminId);
            if (adminProfile.isEmpty() || !"ADMIN".equals(adminProfile.get().getRole())) {
                logger.warn("Non-admin user {} attempted to send system notification", username);
                return ResponseEntity.status(403).body(Map.of(
                    "success", "false", 
                    "message", "Not authorized"
                ));
            }
            
            // Additional data with admin username
            Map<String, Object> additionalData = new HashMap<>();
            if (request.getAdditionalData() != null) {
                additionalData.putAll(request.getAdditionalData());
            }
            additionalData.put("adminUsername", username);
            
            // Create system notification
            notificationService.createSystemNotification(
                request.getMessage(),
                request.getType(),
                request.getUserId(), // null for all users, or specific user ID
                additionalData,
                request.getActionLink()
            );
            
            logger.info("Admin {} sent system notification: {}", username, request.getMessage());
            
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Notification sent successfully"
            ));
        } catch (Exception e) {
            logger.error("Error sending system notification: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", "false",
                "message", "Error sending notification: " + e.getMessage()
            ));
        }
    }

    /**
     * Helper method to get user ID from username
     * @param username the username
     * @return the user ID
     * @throws RuntimeException if user not found
     */
    private Long getUserIdFromUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (!userOptional.isPresent()) {
            logger.error("User not found with username: {}", username);
            throw new RuntimeException("User not found with username: " + username);
        }
        return userOptional.get().getId();
    }
} 