-- Migración: Agregar tabla de administradores y roles
-- Fecha: 2026-01-13

-- Tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Contraseñas: faustina2026 y christian2026 (cambiar en producción)
-- Hash generado con bcrypt rounds=10
INSERT INTO admins (username, password_hash, nombre_completo) VALUES
('faustina', '$2b$10$UHNL8wewwuwrifW/wSXtaO4MFFyim2nEp0TnbwGUoKWIiaqGymrne', 'Faustina'),
('christian', '$2b$10$orGVra2fH5yVy0s1uG73ceGLOHrilD6/UANy9VP8omI9fDfIYypyi', 'Christian')
ON CONFLICT (username) DO NOTHING;

-- Agregar campo role a users para futura expansión
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
