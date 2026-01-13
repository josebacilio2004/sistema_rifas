-- Migración: Sistema de Verificación de Pagos Yape
-- Fecha: 2026-01-13

-- Agregar campos de verificación a transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES admins(id);

-- Función para generar código de confirmación aleatorio
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin caracteres confusos (I, O, 0, 1)
    code TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar código automáticamente al crear transacción
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := generate_confirmation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_confirmation_code ON transactions;
CREATE TRIGGER trigger_set_confirmation_code
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_confirmation_code();

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_transactions_confirmation_code ON transactions(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_transactions_verified ON transactions(verified);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
