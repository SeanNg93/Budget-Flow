package com.financeapp.service;

import com.financeapp.dto.NotificationDto;
import com.financeapp.model.Notification;
import com.financeapp.model.User;
import com.financeapp.repository.NotificationRepository;
import com.financeapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a money transfer notification for both sender and recipient
     */
    @Transactional
    public void createMoneyTransferNotifications(Long senderId, Long recipientId, String amount, String senderWalletName) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found with id: " + senderId));
        
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found with id: " + recipientId));
        
        // Create notification for sender
        Notification senderNotification = Notification.builder()
                .user(sender)
                .message("You sent $" + amount + " to " + recipient.getUsername() + " from your " + senderWalletName + " wallet.")
                .type("MONEY_SENT")
                .read(false)
                .build();
        
        notificationRepository.save(senderNotification);
        
        // Create notification for recipient
        Notification recipientNotification = Notification.builder()
                .user(recipient)
                .message("You received $" + amount + " from " + sender.getUsername() + ".")
                .type("MONEY_RECEIVED")
                .read(false)
                .build();
        
        notificationRepository.save(recipientNotification);
    }

    /**
     * Get all notifications for a user
     */
    public List<NotificationDto> getUserNotifications(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            
            return notifications.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving notifications for user: {}", userId);
            return new ArrayList<>();
        }
    }

    /**
     * Get unread notifications for a user
     */
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            List<Notification> notifications = notificationRepository.findByUserAndReadOrderByCreatedAtDesc(user, false);
            
            return notifications.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving unread notifications for user: {}", userId);
            return new ArrayList<>();
        }
    }

    /**
     * Count unread notifications for a user
     */
    public long countUnreadNotifications(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            return notificationRepository.countByUserAndRead(user, false);
        } catch (Exception e) {
            logger.error("Error counting unread notifications for user: {}", userId);
            return 0;
        }
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public NotificationDto markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        
        return mapToDto(notification);
    }

    /**
     * Mark all notifications for a user as read
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<Notification> unreadNotifications = notificationRepository.findByUserAndReadOrderByCreatedAtDesc(user, false);
        
        unreadNotifications.forEach(notification -> notification.setRead(true));
        
        notificationRepository.saveAll(unreadNotifications);
    }

    /**
     * Map Notification entity to NotificationDto
     */
    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .data(notification.getData())
                .build();
    }
} 