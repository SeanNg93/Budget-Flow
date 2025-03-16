package com.financeapp.service;

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

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final UserProfileService userProfileService;

    @Autowired
    public TransactionService(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            WalletRepository walletRepository,
            WalletService walletService,
            UserProfileService userProfileService) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.walletService = walletService;
        this.userProfileService = userProfileService;
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
} 