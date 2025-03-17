package com.financeapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_delete")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeletedUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "original_user_id", nullable = false, unique = true)
    private Long originalUserId;
    
    @Column(nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    private String fullName;
    
    private String phone;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    private String profilePicturePath;
    
    private String role;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalBalance = BigDecimal.ZERO;
    
    private String currency = "USD";
    
    @Column(name = "is_self_delete")
    private boolean isSelfDelete = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt = LocalDateTime.now();
    
    @Column(name = "user_data", columnDefinition = "JSON")
    private String userData; // JSON string containing additional user data
} 