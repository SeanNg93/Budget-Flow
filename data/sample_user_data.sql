-- Sample User Data for Budget Flow Application
-- This script creates a sample user with complete example data

USE finance_db;

-- Create a sample user
INSERT INTO users (username, email, password_hash, enabled) VALUES 
('user1', 'user1@example.com', '$2a$12$t90fTbL9phbspc0yQIADRevPIyh22atstSFLbPzpcUpjrPA4aTv3W', true);

-- Get the user ID of the newly created user
SET @sample_user_id = LAST_INSERT_ID();

-- Assign USER role to the sample user
INSERT INTO user_roles (user_id, role_id) 
SELECT @sample_user_id, id FROM roles WHERE name = 'ROLE_USER';

-- Create user profile with sample data
INSERT INTO user_profiles (
    user_id, 
    full_name, 
    phone, 
    bio, 
    join_date, 
    profile_picture_path, 
    role, 
    date_of_birth, 
    address, 
    total_balance, 
    currency
) VALUES (
    @sample_user_id,
    'Sample User',
    '+1234567890',
    'I am a sample user demonstrating the features of Budget Flow application.',
    DATE_FORMAT(NOW(), '%Y-%m-%d'),
    '/uploads/profile-pictures/default.png',
    'Regular User',
    '1990-01-15',
    '123 Sample Street, Sample City, 12345',
    0.00, -- Will be updated based on wallet balances
    'USD'
);

-- Add default transaction categories for the sample user
CALL add_default_categories_to_user(@sample_user_id);

-- Add additional sample categories
INSERT INTO transaction_categories (user_id, category_name, type, spending_limit, warning_percentage) VALUES
(@sample_user_id, 'Entertainment', 'EXPENSE', 200.00, 80),
(@sample_user_id, 'Transportation', 'EXPENSE', 150.00, 80),
(@sample_user_id, 'Housing', 'EXPENSE', 1000.00, 90),
(@sample_user_id, 'Shopping', 'EXPENSE', 300.00, 75),
(@sample_user_id, 'Health & Fitness', 'EXPENSE', 100.00, 80),
(@sample_user_id, 'Education', 'EXPENSE', 200.00, 85),
(@sample_user_id, 'Personal Care', 'EXPENSE', 150.00, 80),
(@sample_user_id, 'Gifts & Donations', 'EXPENSE', 100.00, 80),
(@sample_user_id, 'Investments', 'INCOME', NULL, NULL),
(@sample_user_id, 'Freelance', 'INCOME', NULL, NULL),
(@sample_user_id, 'Gifts', 'INCOME', NULL, NULL),
(@sample_user_id, 'Refunds', 'INCOME', NULL, NULL);

-- Create sample wallets
INSERT INTO wallets (user_id, account_name, balance, currency) VALUES
(@sample_user_id, 'Main Checking', 2500.00, 'USD'),
(@sample_user_id, 'Savings', 5000.00, 'USD'),
(@sample_user_id, 'Cash Wallet', 200.00, 'USD'),
(@sample_user_id, 'Investment Account', 10000.00, 'USD');

-- Get the wallet IDs
SET @checking_wallet_id = LAST_INSERT_ID();
SET @savings_wallet_id = @checking_wallet_id + 1;
SET @cash_wallet_id = @checking_wallet_id + 2;
SET @investment_wallet_id = @checking_wallet_id + 3;

-- Set variables for category IDs
-- First get the default categories
SELECT id INTO @uncategorized_expense FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Uncategorized' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @uncategorized_income FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Uncategorized' AND type = 'INCOME' LIMIT 1;

SELECT id INTO @food_dining FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Food & Dining' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @bills_utilities FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Bills & Utilities' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @salary_category FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Salary' AND type = 'INCOME' LIMIT 1;

-- Get additional categories
SELECT id INTO @entertainment FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Entertainment' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @transportation FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Transportation' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @housing FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Housing' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @shopping FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Shopping' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @health_fitness FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Health & Fitness' AND type = 'EXPENSE' LIMIT 1;

SELECT id INTO @freelance FROM transaction_categories 
WHERE user_id = @sample_user_id AND category_name = 'Freelance' AND type = 'INCOME' LIMIT 1;

-- Insert sample transactions for the last 3 months
-- Current month's transactions
INSERT INTO transactions (
    user_id, 
    account_id, 
    transaction_type, 
    amount, 
    category_id, 
    transaction_date, 
    description, 
    status
) VALUES
-- Income transactions
(@sample_user_id, @checking_wallet_id, 'INCOME', 3000.00, @salary_category, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '%Y-%m-%d 09:00:00'),
 'Monthly Salary', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'INCOME', 500.00, @freelance, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '%Y-%m-%d 15:30:00'),
 'Freelance Design Project', 'COMPLETED'),

-- Expense transactions
(@sample_user_id, @checking_wallet_id, 'EXPENSE', 1200.00, @housing, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d 10:00:00'),
 'Monthly Rent', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 120.00, @bills_utilities, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '%Y-%m-%d 14:15:00'),
 'Electricity Bill', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 80.00, @bills_utilities, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '%Y-%m-%d 14:20:00'),
 'Water Bill', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 65.00, @bills_utilities, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '%Y-%m-%d 08:30:00'),
 'Internet Service', 'COMPLETED'),

(@sample_user_id, @cash_wallet_id, 'EXPENSE', 45.00, @food_dining, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d 19:30:00'),
 'Dinner at Italian Restaurant', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 85.00, @shopping, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '%Y-%m-%d 13:45:00'),
 'Grocery Shopping', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 60.00, @entertainment, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '%Y-%m-%d 20:00:00'),
 'Movie Night with Friends', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 35.00, @transportation, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '%Y-%m-%d 08:00:00'),
 'Gas for Car', 'COMPLETED'),

(@sample_user_id, @cash_wallet_id, 'EXPENSE', 12.50, @food_dining, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 0 DAY), '%Y-%m-%d 12:30:00'),
 'Lunch at Cafe', 'COMPLETED'),

-- Previous month's transactions
(@sample_user_id, @checking_wallet_id, 'INCOME', 3000.00, @salary_category, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 32 DAY), '%Y-%m-%d 09:00:00'),
 'Monthly Salary', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 1200.00, @housing, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 31 DAY), '%Y-%m-%d 10:00:00'),
 'Monthly Rent', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 115.00, @bills_utilities, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 35 DAY), '%Y-%m-%d 14:15:00'),
 'Electricity Bill', 'COMPLETED'),

(@sample_user_id, @checking_wallet_id, 'EXPENSE', 125.00, @health_fitness, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 40 DAY), '%Y-%m-%d 11:00:00'),
 'Gym Membership', 'COMPLETED'),

-- Transfers between accounts
(@sample_user_id, @checking_wallet_id, 'TRANSFER', 500.00, @uncategorized_expense, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-%d 16:00:00'),
 'Transfer to Savings', 'COMPLETED'),

(@sample_user_id, @savings_wallet_id, 'TRANSFER', 500.00, @uncategorized_income, 
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-%d 16:00:00'),
 'Transfer from Checking', 'COMPLETED'),

-- Pending transaction
(@sample_user_id, @checking_wallet_id, 'EXPENSE', 49.99, @entertainment, 
 DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '%Y-%m-%d 10:00:00'),
 'Streaming Service Annual Subscription', 'PENDING');

-- Update total_balance in user_profile based on sum of all wallet balances
UPDATE user_profiles 
SET total_balance = (
    SELECT SUM(balance) 
    FROM wallets 
    WHERE user_id = @sample_user_id
)
WHERE user_id = @sample_user_id;

-- Add notification examples
INSERT INTO notifications (user_id, message, type, `read`, data) VALUES
(@sample_user_id, 'Welcome to Budget Flow!', 'WELCOME', FALSE, NULL),
(@sample_user_id, 'Your rent payment is due in 3 days', 'REMINDER', FALSE, NULL),
(@sample_user_id, 'You have exceeded your Entertainment budget by $10', 'BUDGET_ALERT', FALSE, NULL),
(@sample_user_id, 'Your salary has been credited to your account', 'TRANSACTION', TRUE, NULL);

-- Display summary of created data
SELECT 'Sample user data has been successfully created!' as Message;
SELECT 'Username: sampleuser, Password: 123123' as Credentials;

-- Display user details
SELECT u.username, up.full_name, up.total_balance, up.currency
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = @sample_user_id;

-- Display wallet information
SELECT account_name, balance, currency
FROM wallets
WHERE user_id = @sample_user_id
ORDER BY balance DESC;

-- Display transaction counts
SELECT transaction_type, COUNT(*) as count, SUM(amount) as total_amount
FROM transactions
WHERE user_id = @sample_user_id
GROUP BY transaction_type; 