USE finance_db;

-- Insert Roles
INSERT INTO roles (name) VALUES 
('ADMIN'), 
('USER'), 
('ACCOUNTANT');

-- Insert Users
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@finance.com', 'hashedpassword123', 'ADMIN'),
('user1', 'user1@finance.com', 'hashedpassword123', 'USER'),
('user2', 'user2@finance.com', 'hashedpassword123', 'USER'),
('accountant', 'accountant@finance.com', 'hashedpassword123', 'ACCOUNTANT');

-- Assign Roles to Users
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 1),  -- Admin
(2, 2),  -- User 1
(3, 2),  -- User 2
(4, 3);  -- Accountant

-- Insert Accounts
INSERT INTO accounts (user_id, account_name, account_type, balance, currency) VALUES 
(2, 'Checking Account', 'Checking', 5000.00, 'USD'),
(2, 'Savings Account', 'Savings', 10000.00, 'USD'),
(3, 'Investment Portfolio', 'Investment', 15000.00, 'USD');

-- Insert Transaction Categories
INSERT INTO transaction_categories (user_id, category_name, type) VALUES 
(2, 'Salary', 'INCOME'),
(2, 'Groceries', 'EXPENSE'),
(2, 'Rent', 'EXPENSE'),
(3, 'Stock Earnings', 'INCOME'),
(3, 'Dining Out', 'EXPENSE');

-- Insert Transactions
INSERT INTO transactions (user_id, account_id, transaction_type, amount, category_id, transaction_date, description, status) VALUES 
(2, 1, 'INCOME', 3000.00, 1, '2024-03-01 10:00:00', 'Monthly Salary', 'COMPLETED'),
(2, 1, 'EXPENSE', 200.00, 2, '2024-03-02 14:30:00', 'Grocery Shopping', 'COMPLETED'),
(2, 1, 'EXPENSE', 800.00, 3, '2024-03-03 12:00:00', 'March Rent', 'COMPLETED'),
(3, 3, 'INCOME', 500.00, 4, '2024-03-05 11:45:00', 'Stock Investment Profit', 'COMPLETED'),
(3, 3, 'EXPENSE', 100.00, 5, '2024-03-06 19:00:00', 'Dinner at Restaurant', 'COMPLETED');

-- Insert Budgets
INSERT INTO budgets (user_id, category_id, amount, start_date, end_date, status) VALUES 
(2, 2, 500.00, '2024-03-01', '2024-03-31', 'Active'),
(2, 3, 1000.00, '2024-03-01', '2024-03-31', 'Active'),
(3, 5, 200.00, '2024-03-01', '2024-03-31', 'Active');

-- Insert Savings Goals
INSERT INTO savings_goals (user_id, goal_name, target_amount, current_amount, deadline, status) VALUES 
(2, 'Emergency Fund', 5000.00, 1000.00, '2024-12-31', 'Active'),
(3, 'Vacation Trip', 3000.00, 500.00, '2024-08-01', 'Active');

-- Insert Monthly Reports
INSERT INTO monthly_reports (user_id, month, year, total_income, total_expense, net_savings) VALUES 
(2, 3, 2024, 3000.00, 1000.00, 2000.00),
(3, 3, 2024, 500.00, 100.00, 400.00);

-- Insert Audit Logs
INSERT INTO audit_logs (user_id, action, ip_address) VALUES 
(1, 'User login', '192.168.1.1'),
(2, 'Added new transaction', '192.168.1.2'),
(3, 'Updated budget', '192.168.1.3');

-- Insert JWT Blacklist
INSERT INTO jwt_blacklist (user_id, token, expiry_date) VALUES 
(2, 'sampleRevokedToken123', '2024-03-15 00:00:00');

-- Insert Password Reset Tokens
INSERT INTO password_reset_tokens (user_id, token, expiry_date) VALUES 
(2, 'passwordResetToken123', '2024-03-10 23:59:59');
