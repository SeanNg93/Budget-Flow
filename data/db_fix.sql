-- Database Fix Script for Budget Flow Application
-- This script fixes issues with enum types in the database

-- Drop and recreate the database to ensure a clean state
DROP DATABASE IF EXISTS finance_db;
CREATE DATABASE finance_db;
USE finance_db;

-- Create Tables with proper data types for IDs and enum values
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transaction_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_id INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category_id INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES transaction_categories(id) ON DELETE SET NULL
);

-- Insert Test Data

-- Test Users
INSERT INTO users (username, email, password_hash, role) VALUES 
('testuser', 'test@example.com', '$2a$10$zJvQhLXYPqKxqv/QgE/nYOSNMQ1Yp5k6aEmHcGIVXBnPfD9EZ4pZ6', 'USER'),
('testadmin', 'admin@example.com', '$2a$10$jhiChWei0P8QH18hUY2tO.VNrvMgIwYAEkPiHEPqyxlu75kaJo65y', 'ADMIN');

-- Test Accounts
INSERT INTO accounts (user_id, account_name, account_type, balance, currency) VALUES 
(1, 'Test Checking', 'Checking', 1000.00, 'USD'),
(1, 'Test Savings', 'Savings', 5000.00, 'USD'),
(2, 'Admin Account', 'Checking', 2500.00, 'USD');

-- Test Categories
INSERT INTO transaction_categories (user_id, category_name, type) VALUES 
(1, 'Salary', 'INCOME'),
(1, 'Groceries', 'EXPENSE'),
(1, 'Rent', 'EXPENSE'),
(1, 'Entertainment', 'EXPENSE'),
(1, 'Freelance', 'INCOME'),
(2, 'Admin Salary', 'INCOME'),
(2, 'Office Expenses', 'EXPENSE');

-- Test Transactions
INSERT INTO transactions (user_id, account_id, transaction_type, amount, category_id, transaction_date, description, status) VALUES 
(1, 1, 'INCOME', 2000.00, 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 'Monthly Salary', 'COMPLETED'),
(1, 1, 'EXPENSE', 150.00, 2, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Weekly Groceries', 'COMPLETED'),
(1, 1, 'EXPENSE', 800.00, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Monthly Rent', 'COMPLETED'),
(1, 1, 'EXPENSE', 50.00, 4, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Movie Night', 'COMPLETED'),
(1, 2, 'INCOME', 500.00, 5, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Freelance Project', 'COMPLETED'),
(2, 3, 'INCOME', 3000.00, 6, DATE_SUB(NOW(), INTERVAL 7 DAY), 'Admin Salary', 'COMPLETED'),
(2, 3, 'EXPENSE', 200.00, 7, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Office Supplies', 'COMPLETED');

-- Create roles table and user_roles for Spring Security
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Insert roles
INSERT INTO roles (name) VALUES 
('ADMIN'), 
('USER'), 
('ACCOUNTANT');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 2),  -- testuser -> USER
(2, 1);  -- testadmin -> ADMIN

-- Create additional tables needed by the application
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE jwt_blacklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test Queries to verify the schema works correctly

-- Get user's total balance
SELECT SUM(balance) AS total_balance FROM accounts WHERE user_id = 1;

-- Get user's income and expenses
SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS net_savings
FROM transactions
WHERE user_id = 1;

-- Get user's recent transactions
SELECT 
    t.id, 
    t.transaction_type, 
    t.amount, 
    c.category_name, 
    t.transaction_date, 
    t.description, 
    t.status 
FROM transactions t
LEFT JOIN transaction_categories c ON t.category_id = c.id
WHERE t.user_id = 1
ORDER BY t.transaction_date DESC
LIMIT 5;

-- Get monthly summary
SELECT 
    YEAR(transaction_date) AS year,
    MONTH(transaction_date) AS month,
    COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0) AS monthly_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS monthly_expense,
    COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS monthly_savings
FROM transactions
WHERE user_id = 1
GROUP BY YEAR(transaction_date), MONTH(transaction_date)
ORDER BY year DESC, month DESC; 