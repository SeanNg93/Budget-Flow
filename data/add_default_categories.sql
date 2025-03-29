-- =============================================
-- ADD DEFAULT CATEGORIES TO USERS
-- =============================================

USE finance_db;

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

-- Verify that the default categories were added
SELECT u.username, tc.category_name, tc.type
FROM users u
JOIN transaction_categories tc ON u.id = tc.user_id
ORDER BY u.id, tc.type, tc.category_name; 