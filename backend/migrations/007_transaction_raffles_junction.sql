-- Migration: Create junction table for transaction-raffles relationship
-- Description: Allows one transaction to contain multiple raffles
-- Date: 2026-01-18

-- Create junction table
CREATE TABLE IF NOT EXISTS transaction_raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_id, raffle_id)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_transaction_raffles_transaction ON transaction_raffles(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_raffles_raffle ON transaction_raffles(raffle_id);

-- Make raffle_id nullable in transactions (for multi-raffle transactions)
ALTER TABLE transactions ALTER COLUMN raffle_id DROP NOT NULL;

COMMENT ON TABLE transaction_raffles IS 'Junction table linking transactions to multiple raffles';
COMMENT ON COLUMN transaction_raffles.transaction_id IS 'Reference to parent transaction';
COMMENT ON COLUMN transaction_raffles.raffle_id IS 'Reference to raffle included in transaction';
