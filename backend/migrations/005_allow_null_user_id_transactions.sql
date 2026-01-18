-- Migration: Allow NULL user_id in transactions for guest users
-- Description: Removes NOT NULL constraint from user_id column to support guest purchases
-- Date: 2026-01-17

-- Drop the existing foreign key constraint  
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- Modify the column to allow NULL
ALTER TABLE transactions 
ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the foreign key constraint without the NOT NULL requirement
ALTER TABLE transactions 
ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
