package com.financeapp.service;

import com.financeapp.exception.InsufficientFundsException;
import com.financeapp.model.Wallet;
import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.repository.WalletRepository;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final UserProfileService userProfileService;
    private final EntityManager entityManager;

    @Autowired
    public TransactionService(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            WalletRepository walletRepository,
            WalletService walletService,
            UserProfileService userProfileService,
            EntityManager entityManager) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.walletService = walletService;
        this.userProfileService = userProfileService;
        this.entityManager = entityManager;
    }

    public List<Transaction> getAllTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    public Transaction getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + transactionId));
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction, Long userId, Long walletId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new EntityNotFoundException("Wallet not found with id: " + walletId));

        // Validate wallet balance for expense transactions
        if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            BigDecimal walletBalance = wallet.getBalance();
            if (transaction.getAmount().compareTo(walletBalance) > 0) {
                throw new InsufficientFundsException(walletBalance, transaction.getAmount());
            }
        }

        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETED);

        // Update wallet balance and total balance based on transaction type
        if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
            // Add to wallet balance
            walletService.addToBalance(walletId, transaction.getAmount());
            
            // Add to total balance in user profile
            userProfileService.addToTotalBalance(userId, transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            // Subtract from wallet balance
            walletService.subtractFromBalance(walletId, transaction.getAmount());
            
            // Subtract from total balance in user profile
            userProfileService.subtractFromTotalBalance(userId, transaction.getAmount());
        }

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction updateTransaction(Long transactionId, Transaction transactionDetails) {
        Transaction transaction = getTransactionById(transactionId);
        Long userId = transaction.getUser().getId();
        
        // Revert the old transaction's effect on the wallet balance and total balance
        if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
            // Subtract from wallet balance
            walletService.subtractFromBalance(transaction.getWallet().getId(), transaction.getAmount());
            
            // Subtract from total balance in user profile
            userProfileService.subtractFromTotalBalance(userId, transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            // Add back to wallet balance
            walletService.addToBalance(transaction.getWallet().getId(), transaction.getAmount());
            
            // Add back to total balance in user profile
            userProfileService.addToTotalBalance(userId, transaction.getAmount());
        }
        
        // Update transaction details
        transaction.setTransactionType(transactionDetails.getTransactionType());
        transaction.setAmount(transactionDetails.getAmount());
        transaction.setCategory(transactionDetails.getCategory());
        transaction.setDescription(transactionDetails.getDescription());
        transaction.setTransactionDate(transactionDetails.getTransactionDate());
        
        // Apply the new transaction's effect on the wallet balance and total balance
        if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
            // Add to wallet balance
            walletService.addToBalance(transaction.getWallet().getId(), transaction.getAmount());
            
            // Add to total balance in user profile
            userProfileService.addToTotalBalance(userId, transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            // Subtract from wallet balance
            walletService.subtractFromBalance(transaction.getWallet().getId(), transaction.getAmount());
            
            // Subtract from total balance in user profile
            userProfileService.subtractFromTotalBalance(userId, transaction.getAmount());
        }
        
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = getTransactionById(transactionId);
        Long userId = transaction.getUser().getId();
        
        // Revert the transaction's effect on the wallet balance and total balance
        if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
            // Subtract from wallet balance
            walletService.subtractFromBalance(transaction.getWallet().getId(), transaction.getAmount());
            
            // Subtract from total balance in user profile
            userProfileService.subtractFromTotalBalance(userId, transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            // Add back to wallet balance
            walletService.addToBalance(transaction.getWallet().getId(), transaction.getAmount());
            
            // Add back to total balance in user profile
            userProfileService.addToTotalBalance(userId, transaction.getAmount());
        }
        
        transactionRepository.delete(transaction);
    }

    public BigDecimal getTotalIncome(Long userId) {
        BigDecimal totalIncome = transactionRepository.getTotalIncomeByUserId(userId);
        return totalIncome != null ? totalIncome : BigDecimal.ZERO;
    }

    public BigDecimal getTotalExpense(Long userId) {
        BigDecimal totalExpense = transactionRepository.getTotalExpenseByUserId(userId);
        return totalExpense != null ? totalExpense : BigDecimal.ZERO;
    }

    public BigDecimal getNetSavings(Long userId) {
        BigDecimal totalIncome = getTotalIncome(userId);
        BigDecimal totalExpense = getTotalExpense(userId);
        return totalIncome.subtract(totalExpense);
    }

    public BigDecimal getCurrentMonthIncome(Long userId) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = LocalDateTime.now().with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59);
        
        BigDecimal monthlyIncome = transactionRepository.getTotalIncomeByUserIdAndDateRange(userId, startOfMonth, endOfMonth);
        return monthlyIncome != null ? monthlyIncome : BigDecimal.ZERO;
    }

    public BigDecimal getCurrentMonthExpense(Long userId) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = LocalDateTime.now().with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59);
        
        BigDecimal monthlyExpense = transactionRepository.getTotalExpenseByUserIdAndDateRange(userId, startOfMonth, endOfMonth);
        return monthlyExpense != null ? monthlyExpense : BigDecimal.ZERO;
    }

    public BigDecimal getCurrentMonthNetSavings(Long userId) {
        BigDecimal monthlyIncome = getCurrentMonthIncome(userId);
        BigDecimal monthlyExpense = getCurrentMonthExpense(userId);
        return monthlyIncome.subtract(monthlyExpense);
    }

    /**
     * Get all transactions for a specific category
     */
    public List<Transaction> getTransactionsByCategoryId(Long categoryId) {
        return transactionRepository.findByCategoryId(categoryId);
    }

    /**
     * Get financial data grouped by date range for chart visualization
     */
    public List<Map<String, Object>> getFinancialDataByDateRange(
            Long userId, LocalDateTime startDate, LocalDateTime endDate, Integer categoryId, String interval) {
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        try {
            // Determine date format pattern based on interval
            String dateFormatPattern;
            switch (interval) {
                case "week":
                    dateFormatPattern = "'Week 'w";
                    break;
                case "month":
                    dateFormatPattern = "MMM yyyy";
                    break;
                case "year":
                    dateFormatPattern = "yyyy";
                    break;
                default:
                    dateFormatPattern = "yyyy-MM-dd"; // Default to daily
            }
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(dateFormatPattern);
            
            // Create a custom query based on interval
            String periodFormat = getPeriodFormatString(interval);
            String groupBy = "DATE_FORMAT(t.transactionDate, '" + periodFormat + "')";
            
            String sql = "SELECT " + groupBy + " AS period, " +
                    "SUM(CASE WHEN t.transactionType = 'INCOME' THEN t.amount ELSE 0 END) AS income, " +
                    "SUM(CASE WHEN t.transactionType = 'EXPENSE' THEN t.amount ELSE 0 END) AS expenses " +
                    "FROM Transaction t " +
                    "WHERE t.user.id = :userId " +
                    "AND t.transactionDate BETWEEN :startDate AND :endDate ";
            
            if (categoryId != null && categoryId > 0) {
                sql += "AND t.category.id = :categoryId ";
            }
            
            sql += "GROUP BY period ORDER BY MIN(t.transactionDate)";
            
            Query query = entityManager.createQuery(sql);
            query.setParameter("userId", userId);
            query.setParameter("startDate", startDate);
            query.setParameter("endDate", endDate);
            
            if (categoryId != null && categoryId > 0) {
                query.setParameter("categoryId", categoryId);
            }
            
            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();
            
            for (Object[] row : rows) {
                Map<String, Object> dataPoint = new HashMap<>();
                
                // Format period names for better readability
                String periodValue = (String) row[0];
                
                if (interval.equals("day")) {
                    // For daily data, convert to nicer format (e.g. "Mon, Jan 1")
                    try {
                        LocalDate date = LocalDate.parse(periodValue);
                        dataPoint.put("name", date.format(DateTimeFormatter.ofPattern("EEE, MMM d")));
                    } catch (Exception e) {
                        dataPoint.put("name", periodValue);
                    }
                } else {
                    dataPoint.put("name", periodValue);
                }
                
                dataPoint.put("period", periodValue); // Keep original period for reference
                dataPoint.put("income", row[1]);
                dataPoint.put("expenses", row[2]);
                
                result.add(dataPoint);
            }
            
            // If no data but valid date range, create empty points
            if (result.isEmpty() && startDate.isBefore(endDate)) {
                if ("day".equals(interval) && ChronoUnit.DAYS.between(startDate, endDate) <= 60) {
                    // For daily interval with reasonable range, create empty data points
                    LocalDate current = startDate.toLocalDate();
                    LocalDate end = endDate.toLocalDate();
                    
                    while (!current.isAfter(end)) {
                        Map<String, Object> emptyPoint = new HashMap<>();
                        String formattedDate = current.format(formatter);
                        emptyPoint.put("name", current.format(DateTimeFormatter.ofPattern("EEE, MMM d")));
                        emptyPoint.put("period", current.toString());
                        emptyPoint.put("income", BigDecimal.ZERO);
                        emptyPoint.put("expenses", BigDecimal.ZERO);
                        result.add(emptyPoint);
                        
                        current = current.plusDays(1);
                    }
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            // Return empty list on error
        }
        
        return result;
    }

    /**
     * Get summary data for a date range
     */
    public Map<String, Object> getFinancialSummaryByDateRange(
            Long userId, LocalDateTime startDate, LocalDateTime endDate, Integer categoryId) {
        
        Map<String, Object> summary = new HashMap<>();
        
        try {
            String sql = "SELECT " +
                    "SUM(CASE WHEN t.transactionType = 'INCOME' THEN t.amount ELSE 0 END) AS totalIncome, " +
                    "SUM(CASE WHEN t.transactionType = 'EXPENSE' THEN t.amount ELSE 0 END) AS totalExpenses " +
                    "FROM Transaction t " +
                    "WHERE t.user.id = :userId " +
                    "AND t.transactionDate BETWEEN :startDate AND :endDate ";
            
            if (categoryId != null && categoryId > 0) {
                sql += "AND t.category.id = :categoryId ";
            }
            
            Query query = entityManager.createQuery(sql);
            query.setParameter("userId", userId);
            query.setParameter("startDate", startDate);
            query.setParameter("endDate", endDate);
            
            if (categoryId != null && categoryId > 0) {
                query.setParameter("categoryId", categoryId);
            }
            
            Object[] result = (Object[]) query.getSingleResult();
            
            BigDecimal totalIncome = (BigDecimal) (result[0] != null ? result[0] : BigDecimal.ZERO);
            BigDecimal totalExpenses = (BigDecimal) (result[1] != null ? result[1] : BigDecimal.ZERO);
            BigDecimal netSavings = totalIncome.subtract(totalExpenses);
            
            summary.put("totalIncome", totalIncome);
            summary.put("totalExpenses", totalExpenses);
            summary.put("netSavings", netSavings);
            
        } catch (Exception e) {
            e.printStackTrace();
            // Return zeros on error
            summary.put("totalIncome", BigDecimal.ZERO);
            summary.put("totalExpenses", BigDecimal.ZERO);
            summary.put("netSavings", BigDecimal.ZERO);
        }
        
        return summary;
    }

    /**
     * Helper method to get SQL date format pattern for different intervals
     */
    private String getPeriodFormatString(String interval) {
        switch (interval) {
            case "week":
                return "%Y-%u"; // ISO week number (1-53)
            case "month":
                return "%Y-%m"; // Year-month
            case "year":
                return "%Y"; // Year only
            default:
                return "%Y-%m-%d"; // Default to daily
        }
    }
} 