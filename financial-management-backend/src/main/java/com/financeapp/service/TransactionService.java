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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final UserProfileService userProfileService;
    private final EntityManager entityManager;
    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

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
        return transactionRepository.findTransactionsByVisibility(userId);
    }

    public Transaction getTransactionById(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + transactionId));
        
        return transaction;
    }

    public boolean hasAccessToTransaction(Long transactionId, Long userId) {
        Query query = entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM transaction_visibility " +
            "WHERE transaction_id = :transactionId AND user_id = :userId"
        );
        query.setParameter("transactionId", transactionId);
        query.setParameter("userId", userId);
        
        Number count = (Number) query.getSingleResult();
        return count.intValue() > 0;
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction, Long userId, Long walletId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new EntityNotFoundException("Wallet not found with id: " + walletId));

        if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            BigDecimal walletBalance = wallet.getBalance();
            if (transaction.getAmount().compareTo(walletBalance) > 0) {
                throw new InsufficientFundsException(walletBalance, transaction.getAmount());
            }
        }

        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETED);

        Long walletOwnerId = wallet.getUser().getId();
        
        // Log the initial wallet balance before any operations
        logger.info("Before creating transaction - Wallet ID {} initial balance: {}", walletId, wallet.getBalance());
        
        if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
            // For income transactions, we add to both the wallet and total balance
            // Use true for skipAvailableCheck to ensure it doesn't validate against available balance
            walletService.addToBalance(walletId, transaction.getAmount(), true);
            userProfileService.addToTotalBalance(walletOwnerId, transaction.getAmount());
            logger.info("Created INCOME transaction: Added {} to wallet {}", transaction.getAmount(), walletId);
        } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
            // For expense transactions, we subtract from both
            walletService.subtractFromBalance(walletId, transaction.getAmount());
            userProfileService.subtractFromTotalBalance(walletOwnerId, transaction.getAmount());
            logger.info("Created EXPENSE transaction: Subtracted {} from wallet {}", transaction.getAmount(), walletId);
        }
        
        // Log the final wallet balance after the transaction is created
        wallet = walletRepository.findById(walletId).orElse(null);
        if (wallet != null) {
            logger.info("After creating transaction - Wallet ID {} final balance: {}", walletId, wallet.getBalance());
        }

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction updateTransaction(Long transactionId, Transaction transactionDetails) {
        Transaction transaction = getTransactionById(transactionId);
        
        // Store old transaction details for logging and calculations
        Transaction.TransactionType oldType = transaction.getTransactionType();
        BigDecimal oldAmount = transaction.getAmount();
        boolean isTypeChange = oldType != transactionDetails.getTransactionType();
        
        logger.info("Updating transaction ID {}: Type {} -> {}, Amount {} -> {}, Type change: {}", 
            transactionId, 
            oldType, 
            transactionDetails.getTransactionType(),
            oldAmount,
            transactionDetails.getAmount(),
            isTypeChange);
        
        try {
            // Check if wallet is being changed
            boolean isWalletChanged = false;
            Long oldWalletId = null;
            Long oldWalletOwnerId = null;
            
            if (transaction.getWallet() != null) {
                oldWalletId = transaction.getWallet().getId();
                oldWalletOwnerId = transaction.getWallet().getUser().getId();
                
                // If transactionDetails has a different wallet, we're changing wallets
                if (transactionDetails.getWallet() != null && 
                    !transactionDetails.getWallet().getId().equals(oldWalletId)) {
                    isWalletChanged = true;
                    logger.info("Transaction wallet is changing from {} to {}", 
                        oldWalletId, transactionDetails.getWallet().getId());
                }
            }
            
            // Handle wallet change first if needed
            if (isWalletChanged) {
                // First revert the effect from the old wallet
                if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
                    walletService.subtractFromBalance(oldWalletId, transaction.getAmount());
                    userProfileService.subtractFromTotalBalance(oldWalletOwnerId, transaction.getAmount());
                    logger.info("Wallet change - Reverted INCOME: Subtracted {} from old wallet {}", 
                        transaction.getAmount(), oldWalletId);
                } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
                    walletService.addToBalance(oldWalletId, transaction.getAmount(), true);
                    userProfileService.addToTotalBalance(oldWalletOwnerId, transaction.getAmount());
                    logger.info("Wallet change - Reverted EXPENSE: Added {} to old wallet {}", 
                        transaction.getAmount(), oldWalletId);
                }
                
                // Get the new wallet and its owner ID
                Wallet newWallet = walletRepository.findById(transactionDetails.getWallet().getId())
                    .orElseThrow(() -> new EntityNotFoundException("New wallet not found"));
                Long newWalletId = newWallet.getId();
                Long newWalletOwnerId = newWallet.getUser().getId();
                
                // Apply the effect to the new wallet
                if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
                    walletService.addToBalance(newWalletId, transaction.getAmount(), true);
                    userProfileService.addToTotalBalance(newWalletOwnerId, transaction.getAmount());
                    logger.info("Wallet change - Applied INCOME: Added {} to new wallet {}", 
                        transaction.getAmount(), newWalletId);
                } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
                    walletService.subtractFromBalance(newWalletId, transaction.getAmount());
                    userProfileService.subtractFromTotalBalance(newWalletOwnerId, transaction.getAmount());
                    logger.info("Wallet change - Applied EXPENSE: Subtracted {} to new wallet {}", 
                        transaction.getAmount(), newWalletId);
                }
                
                // Update the transaction's wallet
                transaction.setWallet(newWallet);
            }
            
            // Only adjust balances for type/amount changes if the wallet hasn't changed
            // or if the wallet is null (deleted)
            if (!isWalletChanged) {
                // Only adjust balances if the wallet still exists
                if (transaction.getWallet() != null) {
                    // Get the wallet owner ID instead of the transaction creator ID
                    Long walletId = transaction.getWallet().getId();
                    Long walletOwnerId = transaction.getWallet().getUser().getId();
                    
                    // Log the current wallet balance before any operations
                    Wallet wallet = walletRepository.findById(walletId).orElse(null);
                    if (wallet != null) {
                        logger.info("Before reverting old transaction - Wallet ID {} balance: {}", walletId, wallet.getBalance());
                    }
                    
                    // Special handling for transaction type changes between income and expense
                    if (isTypeChange) {
                        // Handle income-to-expense conversion
                        if (oldType == Transaction.TransactionType.INCOME && 
                            transactionDetails.getTransactionType() == Transaction.TransactionType.EXPENSE) {
                            
                            // For income-to-expense, we need to:
                            // 1. First completely remove the income effect (by subtracting the old amount)
                            // 2. Then apply the expense effect (by subtracting the new amount)
                            
                            // Step 1: Revert the income effect
                            walletService.subtractFromBalance(walletId, oldAmount);
                            userProfileService.subtractFromTotalBalance(walletOwnerId, oldAmount);
                            logger.info("TYPE CHANGE - Reverted INCOME: Subtracted {} from wallet {}", oldAmount, walletId);
                            
                            // Get wallet balance after reverting
                            if (wallet != null) {
                                wallet = walletRepository.findById(walletId).orElse(null);
                                logger.info("After reverting income - Wallet ID {} balance: {}", walletId, wallet.getBalance());
                            }
                            
                            // Step 2: Apply the expense effect
                            walletService.subtractFromBalance(walletId, transactionDetails.getAmount());
                            userProfileService.subtractFromTotalBalance(walletOwnerId, transactionDetails.getAmount());
                            logger.info("TYPE CHANGE - Applied EXPENSE: Subtracted {} from wallet {}", 
                                transactionDetails.getAmount(), walletId);
                        } 
                        // Handle expense-to-income conversion
                        else if (oldType == Transaction.TransactionType.EXPENSE && 
                                 transactionDetails.getTransactionType() == Transaction.TransactionType.INCOME) {
                            
                            // For expense-to-income, we need to:
                            // 1. First completely remove the expense effect (by adding back the old amount)
                            // 2. Then apply the income effect (by adding the new amount)
                            
                            // Step 1: Revert the expense effect
                            walletService.addToBalance(walletId, oldAmount, true);
                            userProfileService.addToTotalBalance(walletOwnerId, oldAmount);
                            logger.info("TYPE CHANGE - Reverted EXPENSE: Added {} to wallet {}", oldAmount, walletId);
                            
                            // Get wallet balance after reverting
                            if (wallet != null) {
                                wallet = walletRepository.findById(walletId).orElse(null);
                                logger.info("After reverting expense - Wallet ID {} balance: {}", walletId, wallet.getBalance());
                            }
                            
                            // Step 2: Apply the income effect
                            walletService.addToBalance(walletId, transactionDetails.getAmount(), true);
                            userProfileService.addToTotalBalance(walletOwnerId, transactionDetails.getAmount());
                            logger.info("TYPE CHANGE - Applied INCOME: Added {} to wallet {}", 
                                transactionDetails.getAmount(), walletId);
                        }
                    } else {
                        // Regular update (without type change) - Revert old and apply new
                        // Revert the old transaction's effect on the wallet balance and total balance
                        if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
                            walletService.subtractFromBalance(walletId, transaction.getAmount());
                            
                            // Subtract from the wallet OWNER's total balance
                            userProfileService.subtractFromTotalBalance(walletOwnerId, transaction.getAmount());
                            
                            logger.info("Reverted INCOME transaction: Subtracted {} from wallet {}", transaction.getAmount(), walletId);
                        } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
                            walletService.addToBalance(walletId, transaction.getAmount(), true);
                            
                            // Add back to the wallet OWNER's total balance
                            userProfileService.addToTotalBalance(walletOwnerId, transaction.getAmount());
                            
                            logger.info("Reverted EXPENSE transaction: Added {} to wallet {}", transaction.getAmount(), walletId);
                        }
                    
                        // Log the wallet balance after reverting the old transaction
                        wallet = walletRepository.findById(walletId).orElse(null);
                        if (wallet != null) {
                            logger.info("After reverting old transaction - Wallet ID {} balance: {}", walletId, wallet.getBalance());
                        }
                        
                        // Apply the new transaction (only for same-type updates)
                        wallet = walletRepository.findById(walletId).orElse(null);
                        if (wallet != null) {
                            logger.info("Before applying new transaction - Wallet ID {} balance: {}", walletId, wallet.getBalance());
                        }
                        
                        if (transactionDetails.getTransactionType() == Transaction.TransactionType.INCOME) {
                            walletService.addToBalance(walletId, transactionDetails.getAmount(), true);
                            
                            // Add to the wallet OWNER's total balance
                            userProfileService.addToTotalBalance(walletOwnerId, transactionDetails.getAmount());
                            
                            logger.info("Applied new INCOME transaction: Added {} to wallet {}", transactionDetails.getAmount(), walletId);
                        } else if (transactionDetails.getTransactionType() == Transaction.TransactionType.EXPENSE) {
                            walletService.subtractFromBalance(walletId, transactionDetails.getAmount());
                            
                            // Subtract from the wallet OWNER's total balance
                            userProfileService.subtractFromTotalBalance(walletOwnerId, transactionDetails.getAmount());
                            
                            logger.info("Applied new EXPENSE transaction: Subtracted {} from wallet {}", transactionDetails.getAmount(), walletId);
                        }
                    }
                    
                    // Log the final wallet balance
                    wallet = walletRepository.findById(walletId).orElse(null);
                    if (wallet != null) {
                        logger.info("Final wallet ID {} balance after update: {}", walletId, wallet.getBalance());
                    }
                } else {
                    // If wallet is null (deleted), log this situation
                    // We can't adjust balances since the wallet doesn't exist anymore
                    logger.info("Updating transaction with ID {} that references a deleted wallet", transactionId);
                }
            }
            
            // Update transaction details
            transaction.setTransactionType(transactionDetails.getTransactionType());
            transaction.setAmount(transactionDetails.getAmount());
            transaction.setCategory(transactionDetails.getCategory());
            transaction.setDescription(transactionDetails.getDescription());
            transaction.setTransactionDate(transactionDetails.getTransactionDate());
            
            // If the wallet is being changed (and wasn't handled above already)
            if (!isWalletChanged && transactionDetails.getWallet() != null && 
                (transaction.getWallet() == null || 
                !transaction.getWallet().getId().equals(transactionDetails.getWallet().getId()))) {
                // Get the new wallet from the repository to ensure it's a proper entity
                Wallet newWallet = walletRepository.findById(transactionDetails.getWallet().getId())
                    .orElseThrow(() -> new EntityNotFoundException("New wallet not found"));
                transaction.setWallet(newWallet);
                logger.info("Updated transaction wallet to ID: {}", newWallet.getId());
            }
            
            return transactionRepository.save(transaction);
        } catch (Exception e) {
            logger.error("Error updating transaction {}: {}", transactionId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = getTransactionById(transactionId);
        
        // Only adjust balances if the wallet still exists
        if (transaction.getWallet() != null) {
            // Get the wallet owner ID
            Long walletOwnerId = transaction.getWallet().getUser().getId();
            
            // Revert the transaction's effect on the wallet balance
            if (transaction.getTransactionType() == Transaction.TransactionType.INCOME) {
                walletService.subtractFromBalance(transaction.getWallet().getId(), transaction.getAmount());
                
                // Subtract from the wallet OWNER's total balance
                userProfileService.subtractFromTotalBalance(walletOwnerId, transaction.getAmount());
            } else if (transaction.getTransactionType() == Transaction.TransactionType.EXPENSE) {
                walletService.addToBalance(transaction.getWallet().getId(), transaction.getAmount(), true); // Skip available check
                
                // Add back to the wallet OWNER's total balance
                userProfileService.addToTotalBalance(walletOwnerId, transaction.getAmount());
            }
        } else {
            // If wallet is null (deleted), log this situation
            // We can't adjust balances since the wallet doesn't exist anymore
            // The transaction is likely using originalWalletName instead
            logger.info("Deleting transaction with ID {} that references a deleted wallet", transactionId);
        }
        
        // The before_transaction_delete trigger in MySQL will handle deleting
        // associated transaction_visibility records
        transactionRepository.delete(transaction);
    }

    public Map<String, BigDecimal> getFinancialSummary(Long userId) {
        Map<String, BigDecimal> summary = new HashMap<>();
        
        BigDecimal totalIncome = transactionRepository.getTotalIncomeByVisibility(userId);
        BigDecimal totalExpense = transactionRepository.getTotalExpenseByVisibility(userId);
        
        BigDecimal netSavings = totalIncome.subtract(totalExpense);
        
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = startOfMonth.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59);
        
        Query monthQuery = entityManager.createNativeQuery(
            "SELECT " +
            "   COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END), 0) as monthlyIncome, " +
            "   COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) as monthlyExpense " +
            "FROM transactions t " +
            "JOIN transaction_visibility tv ON t.id = tv.transaction_id " +
            "WHERE tv.user_id = :userId " +
            "AND t.transaction_date BETWEEN :startDate AND :endDate"
        );
        monthQuery.setParameter("userId", userId);
        monthQuery.setParameter("startDate", startOfMonth);
        monthQuery.setParameter("endDate", endOfMonth);
        
        Object[] monthResult = (Object[]) monthQuery.getSingleResult();
        BigDecimal currentMonthIncome = (BigDecimal) monthResult[0];
        BigDecimal currentMonthExpense = (BigDecimal) monthResult[1];
        BigDecimal currentMonthNetSavings = currentMonthIncome.subtract(currentMonthExpense);
        
        BigDecimal totalBalance = userProfileService.getTotalBalance(userId);
        BigDecimal allocatedBalance = walletService.getAllocatedBalance(userId);
        BigDecimal availableBalance = walletService.getAvailableBalance(userId);
        
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpense", totalExpense);
        summary.put("netSavings", netSavings);
        summary.put("currentMonthIncome", currentMonthIncome);
        summary.put("currentMonthExpense", currentMonthExpense);
        summary.put("currentMonthNetSavings", currentMonthNetSavings);
        summary.put("totalBalance", totalBalance);
        summary.put("allocatedBalance", allocatedBalance);
        summary.put("availableBalance", availableBalance);
        
        return summary;
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

    public List<Transaction> getTransactionsByCategoryId(Long categoryId) {
        return transactionRepository.findByCategoryId(categoryId);
    }

    public List<Map<String, Object>> getFinancialDataByDateRange(
            Long userId, LocalDateTime startDate, LocalDateTime endDate, Integer categoryId, String interval) {
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        try {
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
                    dateFormatPattern = "yyyy-MM-dd";
            }
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(dateFormatPattern);
            
            String periodFormat = getPeriodFormatString(interval);
            String groupBy = "DATE_FORMAT(t.transactionDate, '" + periodFormat + "')";
            
            String sql = "SELECT " + groupBy + " AS period, " +
                    "SUM(CASE WHEN t.transactionType = 'INCOME' THEN t.amount ELSE 0 END) AS income, " +
                    "SUM(CASE WHEN t.transactionType = 'EXPENSE' THEN t.amount ELSE 0 END) AS expenses " +
                    "FROM Transaction t " +
                    "JOIN TransactionVisibility tv ON t.id = tv.transaction.id " +
                    "WHERE tv.user.id = :userId " +
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
                
                String periodValue = (String) row[0];
                
                if (interval.equals("day")) {
                    try {
                        LocalDate date = LocalDate.parse(periodValue);
                        dataPoint.put("name", date.format(DateTimeFormatter.ofPattern("EEE, MMM d")));
                    } catch (Exception e) {
                        dataPoint.put("name", periodValue);
                    }
                } else {
                    dataPoint.put("name", periodValue);
                }
                
                dataPoint.put("period", periodValue);
                dataPoint.put("income", row[1]);
                dataPoint.put("expenses", row[2]);
                
                result.add(dataPoint);
            }
            
            if (result.isEmpty() && startDate.isBefore(endDate)) {
                if ("day".equals(interval) && ChronoUnit.DAYS.between(startDate, endDate) <= 60) {
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
        }
        
        return result;
    }

    public Map<String, Object> getFinancialSummaryByDateRange(
            Long userId, LocalDateTime startDate, LocalDateTime endDate, Integer categoryId) {
        
        Map<String, Object> summary = new HashMap<>();
        
        try {
            String sql = "SELECT " +
                    "SUM(CASE WHEN t.transactionType = 'INCOME' THEN t.amount ELSE 0 END) AS totalIncome, " +
                    "SUM(CASE WHEN t.transactionType = 'EXPENSE' THEN t.amount ELSE 0 END) AS totalExpenses " +
                    "FROM Transaction t " +
                    "JOIN TransactionVisibility tv ON t.id = tv.transaction.id " +
                    "WHERE tv.user.id = :userId " +
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
            summary.put("totalIncome", BigDecimal.ZERO);
            summary.put("totalExpenses", BigDecimal.ZERO);
            summary.put("netSavings", BigDecimal.ZERO);
        }
        
        return summary;
    }

    private String getPeriodFormatString(String interval) {
        switch (interval) {
            case "week":
                return "%Y-%u";
            case "month":
                return "%Y-%m";
            case "year":
                return "%Y";
            default:
                return "%Y-%m-%d";
        }
    }
} 