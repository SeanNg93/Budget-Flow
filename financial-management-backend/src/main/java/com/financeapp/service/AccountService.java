package com.financeapp.service;

import com.financeapp.model.Account;
import com.financeapp.model.User;
import com.financeapp.repository.AccountRepository;
import com.financeapp.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Autowired
    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    public List<Account> getAllAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    public Account getAccountById(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found with id: " + accountId));
    }

    @Transactional
    public Account createAccount(Account account, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        account.setUser(user);
        return accountRepository.save(account);
    }

    @Transactional
    public Account updateAccount(Long accountId, Account accountDetails) {
        Account account = getAccountById(accountId);
        account.setAccountName(accountDetails.getAccountName());
        account.setAccountType(accountDetails.getAccountType());
        account.setCurrency(accountDetails.getCurrency());
        return accountRepository.save(account);
    }

    @Transactional
    public void deleteAccount(Long accountId) {
        Account account = getAccountById(accountId);
        accountRepository.delete(account);
    }

    @Transactional
    public Account updateBalance(Long accountId, BigDecimal amount) {
        Account account = getAccountById(accountId);
        account.setBalance(amount);
        return accountRepository.save(account);
    }

    @Transactional
    public Account addToBalance(Long accountId, BigDecimal amount) {
        Account account = getAccountById(accountId);
        account.setBalance(account.getBalance().add(amount));
        return accountRepository.save(account);
    }

    @Transactional
    public Account subtractFromBalance(Long accountId, BigDecimal amount) {
        Account account = getAccountById(accountId);
        account.setBalance(account.getBalance().subtract(amount));
        return accountRepository.save(account);
    }

    public BigDecimal getTotalBalance(Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accounts.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public BigDecimal addToTotalBalance(Long userId, BigDecimal amount) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        
        if (accounts.isEmpty()) {
            // If user has no accounts, create a default one
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            
            Account defaultAccount = new Account();
            defaultAccount.setAccountName("Default Account");
            defaultAccount.setAccountType(Account.AccountType.Checking);
            defaultAccount.setCurrency("USD");
            defaultAccount.setBalance(amount);
            defaultAccount.setUser(user);
            accountRepository.save(defaultAccount);
            
            return amount;
        } else {
            // Add to the first account
            Account firstAccount = accounts.get(0);
            firstAccount.setBalance(firstAccount.getBalance().add(amount));
            accountRepository.save(firstAccount);
            
            // Return the new total balance
            return getTotalBalance(userId);
        }
    }
} 