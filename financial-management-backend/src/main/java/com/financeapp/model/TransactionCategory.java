package com.financeapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "transaction_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;
    
    @Column(name = "spending_limit", precision = 15, scale = 2)
    private BigDecimal spendingLimit;
    
    @Column(name = "warning_percentage")
    private Integer warningPercentage = 80; // Default to 80%

    public enum CategoryType {
        INCOME, EXPENSE
    }
} 