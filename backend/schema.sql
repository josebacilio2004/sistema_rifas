-- Database schema for Rifa system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(8) NOT NULL UNIQUE,
    celular VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raffles table (100 numbers)
CREATE TABLE IF NOT EXISTS raffles (
    id INTEGER PRIMARY KEY CHECK (id >= 1 AND id <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    reserved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reserved_at TIMESTAMP,
    reserved_until TIMESTAMP,
    purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
    purchased_at TIMESTAMP,
    CONSTRAINT reservation_check CHECK (
        (status = 'reserved' AND reserved_by IS NOT NULL AND reserved_at IS NOT NULL AND reserved_until IS NOT NULL) OR
        (status = 'sold' AND purchased_by IS NOT NULL AND purchased_at IS NOT NULL) OR
        (status = 'available' AND reserved_by IS NULL AND purchased_by IS NULL)
    )
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    payment_method VARCHAR(20) DEFAULT 'yape',
    payment_proof_url TEXT,
    payment_reference VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    qr_code_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Initialize all 100 raffle numbers
INSERT INTO raffles (id, status)
SELECT generate_series(1, 100), 'available'
ON CONFLICT (id) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raffles_status ON raffles(status);
CREATE INDEX IF NOT EXISTS idx_raffles_reserved_at ON raffles(reserved_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_raffle_id ON transactions(raffle_id);
CREATE INDEX IF NOT EXISTS idx_users_dni ON users(dni);
