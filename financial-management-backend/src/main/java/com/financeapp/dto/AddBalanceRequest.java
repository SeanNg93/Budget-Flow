package com.financeapp.dto;

import java.math.BigDecimal;

public class AddBalanceRequest {
    private BigDecimal amount;

    public AddBalanceRequest() {
    }

    public AddBalanceRequest(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
} 