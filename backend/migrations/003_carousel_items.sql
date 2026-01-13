-- Migración: Gestor de Carrusel para Admins
-- Fecha: 2026-01-13

-- Tabla para almacenar items del carrusel
CREATE TABLE IF NOT EXISTS carousel_items (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar premios por defecto
INSERT INTO carousel_items (titulo, descripcion, imagen_url, orden) VALUES
('📱 iPhone 16 Pro Max 256GB', 'El último modelo de Apple con todas las funciones premium', 'https://via.placeholder.com/450x450/667eea/ffffff?text=iPhone+16+Pro+Max', 1),
('💻 Laptop Gaming MSI', 'Laptop de alto rendimiento para gaming y trabajo profesional', 'https://via.placeholder.com/450x450/764ba2/ffffff?text=Laptop+Gaming', 2),
('🎮 PlayStation 5 + 2 Juegos', 'Consola PS5 edición estándar con 2 juegos AAA', 'https://via.placeholder.com/450x450/667eea/ffffff?text=PlayStation+5', 3),
('📺 Smart TV Samsung 55"', 'Televisor 4K UHD con tecnología QLED', 'https://via.placeholder.com/450x450/764ba2/ffffff?text=Smart+TV+55', 4)
ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_carousel_items_orden ON carousel_items(orden);
CREATE INDEX IF NOT EXISTS idx_carousel_items_activo ON carousel_items(activo);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_carousel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_carousel_timestamp ON carousel_items;
CREATE TRIGGER trigger_update_carousel_timestamp
    BEFORE UPDATE ON carousel_items
    FOR EACH ROW
    EXECUTE FUNCTION update_carousel_timestamp();
