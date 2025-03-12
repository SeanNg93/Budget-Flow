package com.financeapp.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    private String username;
    private String password;
    private String email; // Thêm email để sử dụng trong đăng ký
}