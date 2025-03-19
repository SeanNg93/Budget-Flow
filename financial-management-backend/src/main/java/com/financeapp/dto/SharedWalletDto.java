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
public class SharedWalletDto {
    private Long id;
    private Long walletId;
    private String walletName;
    private Long ownerId;
    private String ownerUsername;
    private Long sharedWithId;
    private String sharedWithUsername;
    private boolean accepted;
    private LocalDateTime createdAt;
} 