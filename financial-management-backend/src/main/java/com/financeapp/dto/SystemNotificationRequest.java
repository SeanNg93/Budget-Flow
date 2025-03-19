package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemNotificationRequest {
    private String message;
    private String type;
    private Long userId; // Optional - if null, send to all users
    private Map<String, Object> additionalData; // Optional additional data
    private String actionLink; // Optional link for users to navigate to
} 