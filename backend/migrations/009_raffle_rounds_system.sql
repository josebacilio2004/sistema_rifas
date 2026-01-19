-- Migration: Sistema de Rondas de Sorteo con Historial
-- Permite reiniciar rifas y mantener historial de sorteos anteriores

-- Tabla para historial de rondas de sorteo
CREATE TABLE IF NOT EXISTS raffle_rounds (
    id SERIAL PRIMARY KEY,
    round_number INTEGER NOT NULL,
    total_raffles INTEGER NOT NULL DEFAULT 100,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    winner_raffle_id INTEGER,
    winner_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_raffle_rounds_status ON raffle_rounds(status);
CREATE INDEX IF NOT EXISTS idx_raffle_rounds_round_number ON raffle_rounds(round_number);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insertar configuración inicial
INSERT INTO system_config (key, value, description) 
VALUES 
    ('total_raffles', '100', 'Cantidad total de rifas por sorteo'),
    ('current_round', '1', 'Número de ronda actual')
ON CONFLICT (key) DO NOTHING;

-- Crear primera ronda si no existe
INSERT INTO raffle_rounds (round_number, total_raffles, status)
SELECT 1, 100, 'active'
WHERE NOT EXISTS (SELECT 1 FROM raffle_rounds WHERE status = 'active');

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para auto-actualizar updated_at
CREATE TRIGGER update_raffle_rounds_updated_at BEFORE UPDATE ON raffle_rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE raffle_rounds IS 'Historial de rondas de sorteo con información de ganadores';
COMMENT ON TABLE system_config IS 'Configuración global del sistema de rifas';
COMMENT ON COLUMN raffle_rounds.status IS 'Estado: active (en curso), completed (finalizado), cancelled (cancelado)';
