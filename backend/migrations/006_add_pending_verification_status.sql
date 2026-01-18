-- Migration: Add 'pending_verification' status to transactions
-- Description: Updates CHECK constraint to allow 'pending_verification' status
-- Date: 2026-01-18

-- Drop the existing CHECK constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add the new CHECK constraint with 'pending_verification' included
ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'pending_verification', 'completed', 'cancelled'));
