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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Add fields for soft delete functionality
    is_pending_deletion BOOLEAN DEFAULT FALSE,
    deletion_requested_at TIMESTAMP NULL
);

-- Create user_delete table for storing deleted user information
CREATE TABLE user_delete (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    bio TEXT,
    profile_picture_path VARCHAR(255),
    role VARCHAR(50),
    total_balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    is_self_delete BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_data JSON, -- Store additional user data as JSON
    UNIQUE (original_user_id)
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
    total_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
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

CREATE TABLE wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
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
    FOREIGN KEY (account_id) REFERENCES wallets(id) ON DELETE CASCADE,
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

-- Create notifications table for user notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    `read` BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data TEXT,
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
('admin', 'admin@example.com', '$2a$12$GfuKtPTTh1OVhXkW1EabJepwy8DyC2AfL7s0l3YeuvpsqmddE1pKi', true),
('testuser', 'testuser@example.com', '$2a$12$U48NVl/D6kA9FKEgu0md6elK.Ob47CBxKj7dKF2dvAvXQXy2hRW/2', true);

-- Insert default profiles for users with total_balance initialized to 0
INSERT INTO user_profiles (user_id, full_name, join_date, role, total_balance, currency) VALUES
(1, 'Admin User', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'Administrator', 0.00, 'USD'),
(2, 'Test User', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'User', 0.00, 'USD');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 1),  -- admin -> ROLE_ADMIN
(2, 2);  -- testuser -> ROLE_USER

-- =============================================
-- PART 4: CREATE PROCEDURES FOR USER DELETION
-- =============================================

-- Procedure to request account deletion (sets the 30-minute timer)
DELIMITER //
CREATE PROCEDURE request_account_deletion(IN p_user_id INT, IN p_is_self_delete BOOLEAN)
BEGIN
    -- Mark the user for deletion and set the timestamp
    UPDATE users 
    SET is_pending_deletion = TRUE, 
        deletion_requested_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Log the deletion request
    INSERT INTO audit_logs (user_id, action, ip_address)
    VALUES (p_user_id, 
            CASE WHEN p_is_self_delete = TRUE 
                THEN 'SELF_DELETION_REQUESTED' 
                ELSE 'ADMIN_DELETION_REQUESTED' 
            END, 
            '0.0.0.0');
END //
DELIMITER ;

-- Procedure to cancel account deletion (if user logs back in)
DELIMITER //
CREATE PROCEDURE cancel_account_deletion(IN p_user_id INT)
BEGIN
    -- Remove the deletion flag
    UPDATE users 
    SET is_pending_deletion = FALSE, 
        deletion_requested_at = NULL
    WHERE id = p_user_id;
    
    -- Log the cancellation
    INSERT INTO audit_logs (user_id, action, ip_address)
    VALUES (p_user_id, 'DELETION_CANCELLED', '0.0.0.0');
END //
DELIMITER ;

-- Procedure to finalize account deletion (after 30 minutes)
DELIMITER //
CREATE PROCEDURE finalize_account_deletion()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id_to_delete INT;
    DECLARE self_delete BOOLEAN;
    
    -- Cursor to find users who requested deletion more than 30 minutes ago
    DECLARE deletion_cursor CURSOR FOR 
        SELECT id FROM users 
        WHERE is_pending_deletion = TRUE 
        AND deletion_requested_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN deletion_cursor;
    
    deletion_loop: LOOP
        FETCH deletion_cursor INTO user_id_to_delete;
        IF done THEN
            LEAVE deletion_loop;
        END IF;
        
        -- Get if it was a self-delete
        SELECT TRUE INTO self_delete FROM audit_logs 
        WHERE user_id = user_id_to_delete 
        AND action = 'SELF_DELETION_REQUESTED'
        ORDER BY timestamp DESC LIMIT 1;
        
        -- Move user data to user_delete table
        INSERT INTO user_delete (
            original_user_id, 
            username, 
            email, 
            password_hash, 
            full_name, 
            phone, 
            bio, 
            profile_picture_path, 
            role, 
            total_balance, 
            currency, 
            is_self_delete,
            user_data
        )
        SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.password_hash, 
            p.full_name, 
            p.phone, 
            p.bio, 
            p.profile_picture_path, 
            p.role, 
            p.total_balance, 
            p.currency, 
            IFNULL(self_delete, FALSE),
            (
                SELECT JSON_OBJECT(
                    'wallets', (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'account_name', w.account_name,
                            'balance', w.balance,
                            'currency', w.currency
                        )
                    ) FROM wallets w WHERE w.user_id = u.id),
                    'transactions', (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'transaction_type', t.transaction_type,
                            'amount', t.amount,
                            'description', t.description,
                            'transaction_date', t.transaction_date
                        )
                    ) FROM transactions t WHERE t.user_id = u.id),
                    'categories', (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'category_name', tc.category_name,
                            'type', tc.type
                        )
                    ) FROM transaction_categories tc WHERE tc.user_id = u.id)
                )
            )
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = user_id_to_delete;
        
        -- Log the deletion
        INSERT INTO audit_logs (user_id, action, ip_address)
        VALUES (user_id_to_delete, 'ACCOUNT_DELETED', '0.0.0.0');
        
        -- Delete the user (this will cascade to all related tables)
        DELETE FROM users WHERE id = user_id_to_delete;
    END LOOP;
    
    CLOSE deletion_cursor;
END //
DELIMITER ;

-- Create an event to run the finalization procedure every 5 minutes
DELIMITER //
CREATE EVENT IF NOT EXISTS check_pending_deletions
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
    CALL finalize_account_deletion();
END //
DELIMITER ;

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

-- Verify user profiles
SELECT u.username, p.full_name, p.role, p.join_date, p.total_balance
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
-- User Deletion Process:
-- 1. When a user requests deletion (self or admin-initiated), call request_account_deletion(user_id, is_self_delete)
-- 2. If a user logs back in within 30 minutes, call cancel_account_deletion(user_id)
-- 3. After 30 minutes, the scheduled event will automatically move user data to user_delete table
--
-- The Wallet table replaces the earlier Account table, with no account_type field
-- Transaction table's account_id column refers to wallet IDs
-- User profiles now include total_balance and currency fields to track overall balance 
