package com.financeapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String fullName;
    
    private String phone;
    
    private String bio;
    
    private String joinDate;
    
    // Store the path to the profile picture
    private String profilePicturePath;
    
    // Default role/position
    private String role;
    
    // Total balance field (represents all available money)
    @Column(name = "total_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalBalance = BigDecimal.ZERO;
    
    // Currency for the total balance
    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "USD";
    
    // Timestamp fields
    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = createdAt;
        
        // Initialize default values if not set
        if (totalBalance == null) {
            totalBalance = BigDecimal.ZERO;
        }
        if (currency == null || currency.isEmpty()) {
            currency = "USD";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
} 