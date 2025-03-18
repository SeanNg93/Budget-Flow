package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTransferRequest {
    private Long sourceWalletId;
    private String targetUserId; // This could be username or ID
    private BigDecimal amount;
} 