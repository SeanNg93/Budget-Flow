-- 1️⃣ Get Monthly Financial Summary
DELIMITER //
CREATE PROCEDURE GetMonthlySummary(IN userId INT, IN reportMonth INT, IN reportYear INT)
BEGIN
    SELECT 
        SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense,
        (SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END)) AS net_savings
    FROM transactions
    WHERE user_id = userId AND MONTH(transaction_date) = reportMonth AND YEAR(transaction_date) = reportYear;
END //
DELIMITER ;
-- 1️⃣Usage
CALL GetMonthlySummary(2, 3, 2024);


-- 2️⃣ Get All Transactions for a User
DELIMITER //
CREATE PROCEDURE GetUserTransactions(IN userId INT)
BEGIN
    SELECT 
        t.id, t.transaction_type, t.amount, c.category_name, t.transaction_date, t.description, t.status 
    FROM transactions t
    LEFT JOIN transaction_categories c ON t.category_id = c.id
    WHERE t.user_id = userId
    ORDER BY t.transaction_date DESC;
END //
DELIMITER ;
-- 2️⃣Usage
CALL GetUserTransactions(2);





