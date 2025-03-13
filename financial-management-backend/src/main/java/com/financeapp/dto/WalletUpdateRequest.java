package com.financeapp.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WalletUpdateRequest {
    private String walletName;
    private Double balance;
    private String currency;
    private String iconUrl;
    private String description;
}

