-- Database Setup Script for Budget Flow Application
-- This script completely sets up the database with the correct schema and sample data

-- =============================================
-- PART 1: CREATE DATABASE
-- =============================================
DROP DATABASE IF EXISTS finance_db;
CREATE DATABASE finance_db;
USE finance_db;

-- =============================================
-- PART 2: CREATE TABLES
-- =============================================
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

-- Create user_profiles table for storing profile information
CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    bio TEXT,
    join_date VARCHAR(20),
    profile_picture_path VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

-- =============================================
-- PART 3: INSERT INITIAL DATA
-- =============================================
-- Insert roles - Make sure these match exactly with what's in the RoleName enum
INSERT INTO roles (name) VALUES 
('ROLE_ADMIN'), 
('ROLE_USER'), 
('ROLE_ACCOUNTANT');

-- Insert admin and testuser with BCrypt encoded passwords (123123)
INSERT INTO users (username, email, password_hash, enabled) VALUES 
('admin', 'admin@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', true),
('testuser', 'testuser@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', true);

-- Insert default profiles for users
INSERT INTO user_profiles (user_id, full_name, join_date, role) VALUES
(1, 'Admin User', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'Administrator'),
(2, 'Test User', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'User');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 1),  -- admin -> ROLE_ADMIN
(2, 2);  -- testuser -> ROLE_USER

-- =============================================
-- PART 4: INSERT SAMPLE DATA
-- =============================================
-- Insert test accounts
INSERT INTO accounts (user_id, account_name, account_type, balance, currency) VALUES 
(1, 'Admin Account', 'Checking', 2500.00, 'USD'),
(2, 'Checking Account', 'Checking', 1000.00, 'USD'),
(2, 'Savings Account', 'Savings', 5000.00, 'USD');

-- Insert test categories
INSERT INTO transaction_categories (user_id, category_name, type) VALUES 
(1, 'Admin Salary', 'INCOME'),
(1, 'Office Expenses', 'EXPENSE'),
(2, 'Salary', 'INCOME'),
(2, 'Groceries', 'EXPENSE'),
(2, 'Rent', 'EXPENSE'),
(2, 'Entertainment', 'EXPENSE');

-- Insert test transactions
INSERT INTO transactions (user_id, account_id, transaction_type, amount, category_id, transaction_date, description, status) VALUES 
(1, 1, 'INCOME', 3000.00, 1, DATE_SUB(NOW(), INTERVAL 7 DAY), 'Admin Salary', 'COMPLETED'),
(1, 1, 'EXPENSE', 200.00, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Office Supplies', 'COMPLETED'),
(2, 2, 'INCOME', 2000.00, 3, DATE_SUB(NOW(), INTERVAL 15 DAY), 'Monthly Salary', 'COMPLETED'),
(2, 2, 'EXPENSE', 150.00, 4, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Weekly Groceries', 'COMPLETED'),
(2, 2, 'EXPENSE', 800.00, 5, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Monthly Rent', 'COMPLETED'),
(2, 2, 'EXPENSE', 50.00, 6, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Movie Night', 'COMPLETED');

-- =============================================
-- PART 5: VERIFY SETUP
-- =============================================
-- Ensure all users have at least the ROLE_USER role (safety check)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.role_id = r.id
WHERE ur.user_id IS NULL AND r.name = 'ROLE_USER';

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

-- Verify user profiles
SELECT u.username, p.full_name, p.role, p.join_date
FROM user_profiles p
JOIN users u ON p.user_id = u.id
ORDER BY u.id;

-- =============================================
-- USAGE NOTES
-- =============================================
-- To run this script:
-- mysql -u root -p < main.sql
--
-- Default admin user credentials:
-- Username: admin
-- Password: 123123
--
-- Default test user credentials:
-- Username: testuser
-- Password: 123123
--
-- For partial setup or fixing an existing database, use the individual scripts in this directory:
-- 01_create_database.sql - Creates the database
-- 02_create_tables.sql - Creates all tables
-- 03_insert_initial_data.sql - Inserts initial data
-- 04_insert_sample_data.sql - Inserts sample data
-- 05_verify_setup.sql - Verifies the setup
-- 06_ensure_tables_exist.sql - Ensures tables exist without dropping the database
-- 07_create_default_profiles.sql - Creates default profiles for users without profiles 
