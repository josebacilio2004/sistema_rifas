-- Script SQL para limpiar reservas expiradas
-- Ejecutar en Neon Console: https://console.neon.tech/

-- 1. Ver cuántas reservas expiradas hay
SELECT COUNT(*) as expired_reservations
FROM raffles
WHERE status = 'reserved'
  AND reserved_at + INTERVAL '5 minutes' < NOW();

-- 2. Ver detalles de reservas expiradas
SELECT id, reserved_at, 
       AGE(NOW(), reserved_at) as time_since_reservation
FROM raffles
WHERE status = 'reserved'
  AND reserved_at + INTERVAL '5 minutes' < NOW()
ORDER BY reserved_at DESC;

-- 3. LIMPIAR todas las reservas expiradas
UPDATE raffles
SET status = 'available',
    reserved_at = NULL,
    reserved_by = NULL,
    reserved_until = NULL
WHERE status = 'reserved'
  AND reserved_at + INTERVAL '5 minutes' < NOW();

-- 4. Verificar que se limpiaron
SELECT COUNT(*) as remaining_reserved
FROM raffles
WHERE status = 'reserved';
