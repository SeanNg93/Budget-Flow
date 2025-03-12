package com.financeapp.service;

import com.financeapp.model.Account;
import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.repository.AccountRepository;
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
    private final AccountRepository accountRepository;
    private final AccountService accountService;

    @Autowired
    public TransactionService(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            AccountRepository accountRepository,
            AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.accountService = accountService;
    }

    public List<Transaction> getAllTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    public Transaction getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + transactionId));
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction, Long userId, Long accountId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found with id: " + accountId));

        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setStatus(Transaction.TransactionStatus.Completed);

        // Update account balance based on transaction type
        if (transaction.getTransactionType() == Transaction.TransactionType.Income) {
            accountService.addToBalance(accountId, transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.Expense) {
            accountService.subtractFromBalance(accountId, transaction.getAmount());
        }

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction updateTransaction(Long transactionId, Transaction transactionDetails) {
        Transaction transaction = getTransactionById(transactionId);
        
        // Revert the old transaction's effect on the account balance
        if (transaction.getTransactionType() == Transaction.TransactionType.Income) {
            accountService.subtractFromBalance(transaction.getAccount().getId(), transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.Expense) {
            accountService.addToBalance(transaction.getAccount().getId(), transaction.getAmount());
        }
        
        // Update transaction details
        transaction.setTransactionType(transactionDetails.getTransactionType());
        transaction.setAmount(transactionDetails.getAmount());
        transaction.setCategory(transactionDetails.getCategory());
        transaction.setDescription(transactionDetails.getDescription());
        transaction.setTransactionDate(transactionDetails.getTransactionDate());
        
        // Apply the new transaction's effect on the account balance
        if (transaction.getTransactionType() == Transaction.TransactionType.Income) {
            accountService.addToBalance(transaction.getAccount().getId(), transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.Expense) {
            accountService.subtractFromBalance(transaction.getAccount().getId(), transaction.getAmount());
        }
        
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = getTransactionById(transactionId);
        
        // Revert the transaction's effect on the account balance
        if (transaction.getTransactionType() == Transaction.TransactionType.Income) {
            accountService.subtractFromBalance(transaction.getAccount().getId(), transaction.getAmount());
        } else if (transaction.getTransactionType() == Transaction.TransactionType.Expense) {
            accountService.addToBalance(transaction.getAccount().getId(), transaction.getAmount());
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