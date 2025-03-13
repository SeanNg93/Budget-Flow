package com.financeapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WalletRequest {
    @NotBlank
    private String walletName;

    @NotNull
    private BigDecimal balance;

    @NotBlank
    private String currency;

    private String description;

    private String iconUrl;
}

