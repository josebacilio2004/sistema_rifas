-- Migration 008: Add rejection_reason column
-- This allows storing why a payment was rejected

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_status_created 
ON transactions(status, created_at DESC);
