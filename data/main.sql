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
    user_data JSON,
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
    date_of_birth DATE,
    address TEXT,
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

-- Create shared_wallets table for wallet sharing between users
CREATE TABLE shared_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    owner_id INT NOT NULL,
    shared_with_id INT NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (wallet_id, shared_with_id)
);

CREATE TABLE transaction_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    spending_limit DECIMAL(15,2),
    warning_percentage INT DEFAULT 80,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_id INT, 
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category_id INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    original_wallet_name VARCHAR(100) NULL, -- Added column to store name of deleted wallet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES wallets(id) ON DELETE SET NULL, -- Changed ON DELETE CASCADE to SET NULL
    FOREIGN KEY (category_id) REFERENCES transaction_categories(id) ON DELETE SET NULL
);

-- Create transaction_visibility table to track which users can see which transactions
CREATE TABLE transaction_visibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    user_id INT NOT NULL,
    is_creator BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (transaction_id, user_id)
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
-- PART 3: CREATE TRIGGERS
-- =============================================
-- Trigger to automatically add visibility records when transactions are created
DELIMITER //
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE wallet_owner_id INT;
    
    -- First, add visibility for the transaction creator
    INSERT INTO transaction_visibility (transaction_id, user_id, is_creator)
    VALUES (NEW.id, NEW.user_id, TRUE);
    
    -- Find the wallet owner
    SELECT user_id INTO wallet_owner_id FROM wallets WHERE id = NEW.account_id;
    
    -- If the transaction creator is not the wallet owner, add visibility for wallet owner too
    IF NEW.user_id != wallet_owner_id THEN
        INSERT INTO transaction_visibility (transaction_id, user_id, is_creator)
        VALUES (NEW.id, wallet_owner_id, FALSE);
    END IF;
    
    -- Add visibility for all users who have access to the wallet via sharing
    INSERT INTO transaction_visibility (transaction_id, user_id, is_creator)
    SELECT NEW.id, shared_with_id, FALSE
    FROM shared_wallets
    WHERE wallet_id = NEW.account_id
      AND accepted = TRUE
      AND shared_with_id != NEW.user_id
      AND shared_with_id != wallet_owner_id;
END //
DELIMITER ;

-- Trigger to automatically delete transaction_visibility records when transactions are deleted
DELIMITER //
CREATE TRIGGER before_transaction_delete
BEFORE DELETE ON transactions
FOR EACH ROW
BEGIN
    DELETE FROM transaction_visibility WHERE transaction_id = OLD.id;
END //
DELIMITER ;

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
-- PART 4: CREATE DEFAULT CATEGORIES FOR USERS
-- =============================================

-- Create a procedure to add default categories to a user
DELIMITER //
CREATE PROCEDURE add_default_categories_to_user(IN p_user_id INT)
BEGIN
    -- Check if the user already has an "Uncategorized" expense category
    IF NOT EXISTS (
        SELECT 1 FROM transaction_categories 
        WHERE user_id = p_user_id 
        AND category_name = 'Uncategorized'
        AND type = 'EXPENSE'
    ) THEN
        -- Add "Uncategorized" expense category
        INSERT INTO transaction_categories (user_id, category_name, type)
        VALUES (p_user_id, 'Uncategorized', 'EXPENSE');
    END IF;
    
    -- Check if the user already has an "Uncategorized" income category
    IF NOT EXISTS (
        SELECT 1 FROM transaction_categories 
        WHERE user_id = p_user_id 
        AND category_name = 'Uncategorized'
        AND type = 'INCOME'
    ) THEN
        -- Add "Uncategorized" income category
        INSERT INTO transaction_categories (user_id, category_name, type)
        VALUES (p_user_id, 'Uncategorized', 'INCOME');
    END IF;
    
    -- Check and add "Food & Dining" expense category
    IF NOT EXISTS (
        SELECT 1 FROM transaction_categories 
        WHERE user_id = p_user_id 
        AND category_name = 'Food & Dining'
        AND type = 'EXPENSE'
    ) THEN
        INSERT INTO transaction_categories (user_id, category_name, type)
        VALUES (p_user_id, 'Food & Dining', 'EXPENSE');
    END IF;
    
    -- Check and add "Bills & Utilities" expense category
    IF NOT EXISTS (
        SELECT 1 FROM transaction_categories 
        WHERE user_id = p_user_id 
        AND category_name = 'Bills & Utilities'
        AND type = 'EXPENSE'
    ) THEN
        INSERT INTO transaction_categories (user_id, category_name, type)
        VALUES (p_user_id, 'Bills & Utilities', 'EXPENSE');
    END IF;
    
    -- Check and add "Salary" income category
    IF NOT EXISTS (
        SELECT 1 FROM transaction_categories 
        WHERE user_id = p_user_id 
        AND category_name = 'Salary'
        AND type = 'INCOME'
    ) THEN
        INSERT INTO transaction_categories (user_id, category_name, type)
        VALUES (p_user_id, 'Salary', 'INCOME');
    END IF;
END //
DELIMITER ;

-- Add default categories to all existing users
INSERT INTO transaction_categories (user_id, category_name, type)
SELECT u.id, 'Uncategorized', 'EXPENSE'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_categories tc 
    WHERE tc.user_id = u.id 
    AND tc.category_name = 'Uncategorized' 
    AND tc.type = 'EXPENSE'
);

INSERT INTO transaction_categories (user_id, category_name, type)
SELECT u.id, 'Uncategorized', 'INCOME'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_categories tc 
    WHERE tc.user_id = u.id 
    AND tc.category_name = 'Uncategorized' 
    AND tc.type = 'INCOME'
);

INSERT INTO transaction_categories (user_id, category_name, type)
SELECT u.id, 'Food & Dining', 'EXPENSE'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_categories tc 
    WHERE tc.user_id = u.id 
    AND tc.category_name = 'Food & Dining' 
    AND tc.type = 'EXPENSE'
);

INSERT INTO transaction_categories (user_id, category_name, type)
SELECT u.id, 'Bills & Utilities', 'EXPENSE'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_categories tc 
    WHERE tc.user_id = u.id 
    AND tc.category_name = 'Bills & Utilities' 
    AND tc.type = 'EXPENSE'
);

INSERT INTO transaction_categories (user_id, category_name, type)
SELECT u.id, 'Salary', 'INCOME'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_categories tc 
    WHERE tc.user_id = u.id 
    AND tc.category_name = 'Salary' 
    AND tc.type = 'INCOME'
);

-- Create a trigger to add default categories when a new user is created
DELIMITER //
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    CALL add_default_categories_to_user(NEW.id);
END //
DELIMITER ;

-- =============================================
-- PART 5: CREATE PROCEDURES FOR USER DELETION
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
-- PART 5: CREATE PROCEDURES FOR CHART DATA
-- =============================================

-- Drop procedures if they exist to avoid errors
DROP PROCEDURE IF EXISTS get_financial_data_by_date_range;
DROP PROCEDURE IF EXISTS determine_chart_interval;
DROP VIEW IF EXISTS v_financial_summary;

DELIMITER //

-- Procedure to get financial data by date range for charts
CREATE PROCEDURE get_financial_data_by_date_range(
    IN p_user_id INT,
    IN p_start_date TIMESTAMP,
    IN p_end_date TIMESTAMP,
    IN p_category_id INT,
    IN p_interval VARCHAR(20) -- 'day', 'week', 'month', 'year'
)
BEGIN
    DECLARE date_format_pattern VARCHAR(50);
    
    -- Set date format based on interval
    CASE p_interval
        WHEN 'day' THEN SET date_format_pattern = '%Y-%m-%d';
        WHEN 'week' THEN SET date_format_pattern = '%Y-%u'; -- Year and week number
        WHEN 'month' THEN SET date_format_pattern = '%Y-%m';
        WHEN 'year' THEN SET date_format_pattern = '%Y';
        ELSE SET date_format_pattern = '%Y-%m-%d'; -- Default to daily
    END CASE;
    
    -- Get chart data grouped by date period
    IF p_category_id IS NULL OR p_category_id = 0 THEN
        -- Query without category filter using transaction_visibility for user access
        SELECT 
            DATE_FORMAT(t.transaction_date, date_format_pattern) AS period,
            SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END) AS income,
            SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END) AS expenses
        FROM transactions t
        JOIN transaction_visibility tv ON t.id = tv.transaction_id
        WHERE tv.user_id = p_user_id
          AND t.transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY period
        ORDER BY MIN(t.transaction_date);
    ELSE
        -- Query with category filter using transaction_visibility for user access
        SELECT 
            DATE_FORMAT(t.transaction_date, date_format_pattern) AS period,
            SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END) AS income,
            SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END) AS expenses
        FROM transactions t
        JOIN transaction_visibility tv ON t.id = tv.transaction_id
        WHERE tv.user_id = p_user_id
          AND t.transaction_date BETWEEN p_start_date AND p_end_date
          AND t.category_id = p_category_id
        GROUP BY period
        ORDER BY MIN(t.transaction_date);
    END IF;
    
    -- Get summary data using transaction_visibility
    SELECT
        SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END) AS total_expenses,
        SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE -t.amount END) AS net_savings
    FROM transactions t
    JOIN transaction_visibility tv ON t.id = tv.transaction_id
    WHERE tv.user_id = p_user_id
      AND t.transaction_date BETWEEN p_start_date AND p_end_date
      AND (p_category_id IS NULL OR p_category_id = 0 OR t.category_id = p_category_id);
END //

-- Procedure to determine appropriate interval based on date range
CREATE PROCEDURE determine_chart_interval(
    IN p_start_date TIMESTAMP,
    IN p_end_date TIMESTAMP,
    OUT p_interval VARCHAR(20)
)
BEGIN
    DECLARE days_difference INT;
    
    -- Calculate days between dates
    SET days_difference = DATEDIFF(p_end_date, p_start_date);
    
    -- Set interval based on date range
    IF days_difference <= 14 THEN
        SET p_interval = 'day'; -- Daily for up to 2 weeks
    ELSEIF days_difference <= 90 THEN
        SET p_interval = 'week'; -- Weekly for up to 3 months
    ELSEIF days_difference <= 730 THEN
        SET p_interval = 'month'; -- Monthly for up to 2 years
    ELSE
        SET p_interval = 'year'; -- Yearly for longer periods
    END IF;
END //

DELIMITER ;

-- Add view to simplify chart data access
CREATE OR REPLACE VIEW v_financial_summary AS
SELECT 
    tv.user_id,
    DATE_FORMAT(t.transaction_date, '%Y-%m') AS month,
    SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END) AS monthly_income,
    SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END) AS monthly_expenses,
    SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE -t.amount END) AS monthly_net
FROM transactions t
JOIN transaction_visibility tv ON t.id = tv.transaction_id
GROUP BY tv.user_id, month
ORDER BY tv.user_id, month;

-- =============================================
-- PART 6: CREATE PROCEDURES FOR TRANSACTION ACCESS
-- =============================================

-- Procedure to get all transactions for a user including shared wallet transactions
DELIMITER //
CREATE PROCEDURE get_user_transactions(
    IN p_user_id INT,
    IN p_start_date TIMESTAMP,
    IN p_end_date TIMESTAMP,
    IN p_wallet_id INT,
    IN p_category_id INT
)
BEGIN
    -- Select transactions with proper filtering
    SELECT 
        t.*,
        w.account_name AS wallet_name,
        w.user_id AS wallet_owner_id,
        c.category_name,
        c.type AS category_type,
        tv.is_creator
    FROM transactions t
    JOIN transaction_visibility tv ON t.id = tv.transaction_id
    JOIN wallets w ON t.account_id = w.id
    LEFT JOIN transaction_categories c ON t.category_id = c.id
    WHERE tv.user_id = p_user_id
      AND (p_start_date IS NULL OR t.transaction_date >= p_start_date)
      AND (p_end_date IS NULL OR t.transaction_date <= p_end_date)
      AND (p_wallet_id IS NULL OR p_wallet_id = 0 OR t.account_id = p_wallet_id)
      AND (p_category_id IS NULL OR p_category_id = 0 OR t.category_id = p_category_id)
    ORDER BY t.transaction_date DESC;
END //
DELIMITER ;

-- =============================================
-- PART 7: VERIFY SETUP
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
-- Transaction visibility: Transactions in shared wallets now appear for all users with access to the wallet
