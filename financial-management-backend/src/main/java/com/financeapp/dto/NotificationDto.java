package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String message;
    private String type; 
    private boolean read;
    private LocalDateTime createdAt;
    private String data; // Additional JSON data
    private Long senderId; 
    private String actionLink;
} 