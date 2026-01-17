-- SCRIPT DEFINITIVO: Liberar TODAS las rifas reservadas
-- Ejecutar en Neon SQL Editor

-- 1. Ver todas las rifas reservadas
SELECT id, status, reserved_at, reserved_by
FROM raffles
WHERE status = 'reserved'
ORDER BY id;

-- 2. LIBERAR TODAS (sin importar tiempo)
UPDATE raffles
SET status = 'available',
    reserved_at = NULL,
    reserved_by = NULL,
    reserved_until = NULL
WHERE status = 'reserved';

-- 3. Confirmar
SELECT COUNT(*) as total_available, 
       (SELECT COUNT(*) FROM raffles WHERE status = 'reserved') as still_reserved
FROM raffles
WHERE status = 'available';
