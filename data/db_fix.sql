-- Database Fix Script for Budget Flow Application
-- This script completely resets and sets up the database with the correct schema

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
    reset_password_token VARCHAR(255),
    reset_password_token_expiry TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    activation_token VARCHAR(255),
    activation_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create roles table for Spring Security
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- Create user_roles table for many-to-many relationship
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
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

-- Insert Initial Data

-- Insert roles - Make sure these match exactly with what's in the RoleName enum
INSERT INTO roles (name) VALUES 
('ROLE_ADMIN'), 
('ROLE_USER'), 
('ROLE_ACCOUNTANT');

-- Insert test users with BCrypt encoded passwords
-- Password for all users is 'password'
INSERT INTO users (username, email, password_hash, enabled) VALUES 
('user', 'user@example.com', '$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bP7RFcGIWNhyFrrT3YUi', true),
('admin', 'admin@example.com', '$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bP7RFcGIWNhyFrrT3YUi', true),
('sean_test1', 'sean@example.com', '$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bP7RFcGIWNhyFrrT3YUi', true);

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 2),  -- user -> ROLE_USER
(2, 1),  -- admin -> ROLE_ADMIN
(3, 2);  -- sean_test1 -> ROLE_USER

-- Insert test accounts
INSERT INTO accounts (user_id, account_name, account_type, balance, currency) VALUES 
(1, 'Checking Account', 'Checking', 1000.00, 'USD'),
(1, 'Savings Account', 'Savings', 5000.00, 'USD'),
(2, 'Admin Account', 'Checking', 2500.00, 'USD'),
(3, 'Sean Checking', 'Checking', 3000.00, 'USD'),
(3, 'Sean Savings', 'Savings', 7500.00, 'USD');

-- Insert test categories
INSERT INTO transaction_categories (user_id, category_name, type) VALUES 
(1, 'Salary', 'INCOME'),
(1, 'Groceries', 'EXPENSE'),
(1, 'Rent', 'EXPENSE'),
(1, 'Entertainment', 'EXPENSE'),
(1, 'Freelance', 'INCOME'),
(2, 'Admin Salary', 'INCOME'),
(2, 'Office Expenses', 'EXPENSE'),
(3, 'Salary', 'INCOME'),
(3, 'Food', 'EXPENSE'),
(3, 'Housing', 'EXPENSE'),
(3, 'Transportation', 'EXPENSE');

-- Insert test transactions
INSERT INTO transactions (user_id, account_id, transaction_type, amount, category_id, transaction_date, description, status) VALUES 
(1, 1, 'INCOME', 2000.00, 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 'Monthly Salary', 'COMPLETED'),
(1, 1, 'EXPENSE', 150.00, 2, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Weekly Groceries', 'COMPLETED'),
(1, 1, 'EXPENSE', 800.00, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Monthly Rent', 'COMPLETED'),
(1, 1, 'EXPENSE', 50.00, 4, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Movie Night', 'COMPLETED'),
(1, 2, 'INCOME', 500.00, 5, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Freelance Project', 'COMPLETED'),
(2, 3, 'INCOME', 3000.00, 6, DATE_SUB(NOW(), INTERVAL 7 DAY), 'Admin Salary', 'COMPLETED'),
(2, 3, 'EXPENSE', 200.00, 7, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Office Supplies', 'COMPLETED'),
(3, 4, 'INCOME', 2500.00, 8, DATE_SUB(NOW(), INTERVAL 14 DAY), 'Monthly Salary', 'COMPLETED'),
(3, 4, 'EXPENSE', 200.00, 9, DATE_SUB(NOW(), INTERVAL 8 DAY), 'Grocery Shopping', 'COMPLETED'),
(3, 4, 'EXPENSE', 1000.00, 10, DATE_SUB(NOW(), INTERVAL 6 DAY), 'Rent Payment', 'COMPLETED'),
(3, 4, 'EXPENSE', 100.00, 11, DATE_SUB(NOW(), INTERVAL 4 DAY), 'Gas', 'COMPLETED');

-- Verify the database setup
SELECT 'Database setup completed successfully!' AS message;

-- Verify roles are correctly assigned
SELECT u.id, u.username, r.name AS role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.id;

-- Verify user accounts
SELECT u.username, a.account_name, a.balance, a.currency
FROM accounts a
JOIN users u ON a.user_id = u.id
ORDER BY u.id, a.id;

-- Verify transactions
SELECT u.username, a.account_name, t.transaction_type, t.amount, c.category_name, t.description
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN accounts a ON t.account_id = a.id
LEFT JOIN transaction_categories c ON t.category_id = c.id
ORDER BY t.transaction_date DESC
LIMIT 10; 