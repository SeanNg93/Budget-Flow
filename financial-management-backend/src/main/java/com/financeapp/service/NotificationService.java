package com.financeapp.service;

import com.financeapp.dto.NotificationDto;
import com.financeapp.model.Notification;
import com.financeapp.model.User;
import com.financeapp.repository.NotificationRepository;
import com.financeapp.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, ObjectMapper objectMapper, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Generic method to create a notification
     * 
     * @param userId the user to notify
     * @param message the notification message
     * @param type the notification type (e.g., MONEY_SENT, WALLET_SHARED)
     * @param senderId the user who triggered the notification (optional)
     * @param additionalData additional data to store as JSON (optional)
     * @param actionLink an optional link to direct users to (optional)
     * @return the created notification
     */
    @Transactional
    public Notification createNotification(Long userId, String message, String type, 
                                         Long senderId, Map<String, Object> additionalData, String actionLink) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            String dataJson = null;
            if (additionalData != null) {
                try {
                    // Add sender ID and action link to the data if provided
                    if (senderId != null) {
                        additionalData.put("senderId", senderId);
                    }
                    if (actionLink != null) {
                        additionalData.put("actionLink", actionLink);
                    }
                    dataJson = objectMapper.writeValueAsString(additionalData);
                } catch (Exception e) {
                    logger.error("Error serializing notification data", e);
                }
            }
            
            Notification notification = Notification.builder()
                    .user(user)
                    .message(message)
                    .type(type)
                    .read(false)
                    .data(dataJson)
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);

            // Send notification via WebSocket
            NotificationDto notificationDto = mapToDto(savedNotification);
            String destination = "/user/" + user.getUsername() + "/queue/notifications";
            messagingTemplate.convertAndSend(destination, notificationDto);
            logger.info("Sent notification to {}: {}", destination, notificationDto.getMessage());

            return savedNotification;
        } catch (Exception e) {
            logger.error("Error creating notification for user: {}", userId, e);
            throw new RuntimeException("Failed to create notification", e);
        }
    }

    /**
     * Create a money transfer notification for both sender and recipient
     */
    @Transactional
    public void createMoneyTransferNotifications(Long senderId, Long recipientId, String amount, String senderWalletName) {
        try {
            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found with id: " + senderId));
            
            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found with id: " + recipientId));
            
            // Create additional data
            Map<String, Object> senderData = new HashMap<>();
            senderData.put("amount", amount);
            senderData.put("recipientUsername", recipient.getUsername());
            senderData.put("recipientId", recipientId);
            senderData.put("walletName", senderWalletName);
            
            // Create notification for sender (will also send via WebSocket)
            createNotification(
                senderId,
                "You sent $" + amount + " to " + recipient.getUsername() + " from your " + senderWalletName + " wallet.",
                "MONEY_SENT",
                null, 
                senderData,
                null 
            );
            
            // Create additional data for recipient
            Map<String, Object> recipientData = new HashMap<>();
            recipientData.put("amount", amount);
            recipientData.put("senderUsername", sender.getUsername());
            recipientData.put("senderId", senderId);
            
            // Create notification for recipient (will also send via WebSocket)
            createNotification(
                recipientId,
                "You received $" + amount + " from " + sender.getUsername() + ".",
                "MONEY_RECEIVED",
                senderId,
                recipientData,
                null 
            );
        } catch (Exception e) {
            logger.error("Error creating money transfer notifications", e);
        }
    }

    /**
     * Create a wallet sharing notification
     */
    @Transactional
    public void createWalletSharingNotification(Long ownerId, Long recipientId, String walletName) {
        try {
            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new RuntimeException("Owner not found with id: " + ownerId));
            
            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found with id: " + recipientId));
            
            // Create additional data for owner
            Map<String, Object> ownerData = new HashMap<>();
            ownerData.put("walletName", walletName);
            ownerData.put("recipientUsername", recipient.getUsername());
            ownerData.put("recipientId", recipientId);
            
            // Create notification for the owner (will also send via WebSocket)
            createNotification(
                ownerId,
                "You shared your wallet \"" + walletName + "\" with " + recipient.getUsername() + ".",
                "WALLET_SHARED",
                null,
                ownerData,
                null
            );
            
            // Create additional data for recipient
            Map<String, Object> recipientData = new HashMap<>();
            recipientData.put("walletName", walletName);
            recipientData.put("ownerUsername", owner.getUsername());
            recipientData.put("ownerId", ownerId);
            
            // Action link for shared wallet page
            String actionLink = "/shared-wallets"; 
            
            // Create notification for the recipient (will also send via WebSocket)
            createNotification(
                recipientId,
                owner.getUsername() + " shared their wallet \"" + walletName + "\" with you.",
                "WALLET_RECEIVED",
                ownerId,
                recipientData,
                actionLink
            );
        } catch (Exception e) {
            logger.error("Error creating wallet sharing notifications", e);
        }
    }

    /**
     * Create a notification for accepting a shared wallet
     */
    @Transactional
    public void createWalletAcceptedNotification(Long ownerId, Long recipientId, String walletName) {
        try {
            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new RuntimeException("Owner not found with id: " + ownerId));
            
            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found with id: " + recipientId));
            
            // Create additional data using HashMap
            Map<String, Object> data = new HashMap<>();
            data.put("walletName", walletName);
            data.put("recipientUsername", recipient.getUsername());
            data.put("recipientId", recipientId);
            
            // Action link to the shared wallet
            String actionLink = "/wallets"; 
            
            // Create notification for the owner (will also send via WebSocket)
            createNotification(
                ownerId,
                recipient.getUsername() + " accepted your shared wallet \"" + walletName + "\".",
                "WALLET_SHARE_ACCEPTED",
                recipientId,
                data,
                actionLink
            );
        } catch (Exception e) {
            logger.error("Error creating wallet accepted notification", e);
        }
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
     * Delete all notifications for a user
     */
    @Transactional
    public void deleteAllNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        notificationRepository.deleteAll(notifications);
    }

    /**
     * Map Notification entity to NotificationDto
     */
    private NotificationDto mapToDto(Notification notification) {
        NotificationDto dto = NotificationDto.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .data(notification.getData())
                .build();
        
        // Parse additional data if available
        if (notification.getData() != null && !notification.getData().isEmpty()) {
            try {
                Map<String, Object> dataMap = objectMapper.readValue(notification.getData(), Map.class);
                
                // Extract sender ID if available
                if (dataMap.containsKey("senderId")) {
                    dto.setSenderId(Long.valueOf(dataMap.get("senderId").toString()));
                }
                
                // Extract action link if available
                if (dataMap.containsKey("actionLink")) {
                    dto.setActionLink(dataMap.get("actionLink").toString());
                }
            } catch (Exception e) {
                logger.error("Error parsing notification data JSON", e);
            }
        }
        
        return dto;
    }

    /**
     * Create a system notification that can be sent to all users or a specific user
     * 
     * @param message the notification message
     * @param notificationType the notification type
     * @param userId optional specific user to notify (null for all users)
     * @param additionalData optional additional data
     * @param actionLink optional action link
     */
    @Transactional
    public void createSystemNotification(String message, String notificationType, 
                                        Long userId, Map<String, Object> additionalData, String actionLink) {
        try {
            if (userId != null) {
                // Send to specific user (will also send via WebSocket)
                createNotification(userId, message, notificationType, null, additionalData, actionLink);
                logger.info("System notification sent to user {}: {}", userId, message);
            } else {
                // Send to all users
                List<User> allUsers = userRepository.findAll();
                for (User user : allUsers) {
                    // createNotification will handle WebSocket sending for each user
                    createNotification(user.getId(), message, notificationType, null, additionalData, actionLink);
                }
                logger.info("System notification sent to all users: {}", message);
            }
        } catch (Exception e) {
            logger.error("Error creating system notification", e);
        }
    }
} 