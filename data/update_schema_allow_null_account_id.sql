-- update_schema_allow_null_account_id.sql
-- This script modifies the transactions table to allow account_id to be NULL
-- and sets the foreign key constraint to SET NULL ON DELETE.
-- Apply this to your existing finance_db database.

USE finance_db;

-- Step 1: Allow the account_id column to be NULL
ALTER TABLE transactions MODIFY account_id INT NULL;

-- Step 2: Find the existing foreign key constraint name for account_id.
-- You need to run this query first and replace 'YOUR_CONSTRAINT_NAME' below
-- with the actual constraint name found.
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'finance_db' 
  AND TABLE_NAME = 'transactions' 
  AND COLUMN_NAME = 'account_id'
  AND REFERENCED_TABLE_NAME = 'wallets'; 
  
-- Step 3: Drop the existing foreign key constraint (Replace 'YOUR_CONSTRAINT_NAME')
-- Example: ALTER TABLE transactions DROP FOREIGN KEY transactions_ibfk_2;
-- ALTER TABLE transactions DROP FOREIGN KEY YOUR_CONSTRAINT_NAME; 
-- Uncomment the line above and replace YOUR_CONSTRAINT_NAME after running Step 2

-- Step 4: Add the new foreign key constraint with ON DELETE SET NULL
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_wallets_set_null 
FOREIGN KEY (account_id) REFERENCES wallets(id) ON DELETE SET NULL;

SELECT 'Schema update to allow NULL account_id completed.' AS message;
