-- Migration: Add raffle system control
-- Description: Add global control to enable/disable raffle purchases

-- Add raffle_system_config table
CREATE TABLE IF NOT EXISTS raffle_system_config (
    id SERIAL PRIMARY KEY,
    sales_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);

-- Insert default configuration
INSERT INTO raffle_system_config (sales_enabled) 
VALUES (true)
ON CONFLICT DO NOTHING;

-- Add function to update timestamp
CREATE OR REPLACE FUNCTION update_raffle_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS raffle_config_update_trigger ON raffle_system_config;
CREATE TRIGGER raffle_config_update_trigger
    BEFORE UPDATE ON raffle_system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_raffle_config_timestamp();
