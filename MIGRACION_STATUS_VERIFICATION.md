# Migración Adicional: Agregar Status 'pending_verification'

## Problema
El sistema está intentando insertar transacciones con status `'pending_verification'` pero el CHECK constraint de la tabla solo permite: `'pending', 'completed', 'cancelled'`.

**Error actual:**
```
new row for relation "transactions" violates check constraint "transactions_status_check"
```

## Solución

Ejecutar migración `006_add_pending_verification_status.sql` en Neon.

## Ejecutar en Neon Console

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Pega y ejecuta:

```sql
-- Drop the existing CHECK constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add the new CHECK constraint with 'pending_verification' included
ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'pending_verification', 'completed', 'cancelled'));
```

5. Click **Run**

## Verificar

Después de ejecutar:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'transactions_status_check';
```

Debe mostrar el constraint actualizado incluyendo `'pending_verification'`.

## Probar

Intenta nuevamente una compra guest - ahora debería funcionar completamente.
