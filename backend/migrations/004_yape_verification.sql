-- Migration 004: Yape Verification System
-- Adds fields to support automatic Yape payment verification via WhatsApp webhooks

-- Add Yape verification columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS yape_operation_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS yape_sender_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS verified_by_webhook BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_verified_at TIMESTAMP;

-- Create index for fast operation code lookups
CREATE INDEX IF NOT EXISTS idx_yape_operation_code ON transactions(yape_operation_code);
CREATE INDEX IF NOT EXISTS idx_webhook_verified ON transactions(verified_by_webhook, status);

-- Add comment explaining the columns
COMMENT ON COLUMN transactions.yape_operation_code IS 'Código de operación de Yape extraído del mensaje de WhatsApp';
COMMENT ON COLUMN transactions.yape_sender_name IS 'Nombre del remitente según mensaje de Yape';
COMMENT ON COLUMN transactions.verified_by_webhook IS 'True si el pago fue verificado automáticamente por webhook de n8n';
COMMENT ON COLUMN transactions.webhook_verified_at IS 'Timestamp cuando el webhook verificó el pago';

-- Update existing pending transactions to have verified_by_webhook = false
UPDATE transactions 
SET verified_by_webhook = false 
WHERE verified_by_webhook IS NULL;
