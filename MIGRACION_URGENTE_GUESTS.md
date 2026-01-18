# Migración Urgente: Permitir Transacciones de Usuarios Guest

## Problema
El sistema no puede procesar compras de usuarios no registrados (guests) porque la columna `user_id` en la tabla `transactions` tiene restricción NOT NULL.

**Error actual:**
```
null value in column "user_id" of relation "transactions" violates not-null constraint
```

## Solución 

Ejecutar la migración `005_allow_null_user_id_transactions.sql` en la base de datos de producción.

## Instrucciones para Render

### Opción 1: Desde el Dashboard de Render (Recomendado)

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio de PostgreSQL
3. Clic en "Connect" → "External Connection" o "Shell"
4. Ejecuta el siguiente SQL:

```sql
-- Drop the existing foreign key constraint  
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- Modify the column to allow NULL
ALTER TABLE transactions 
ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the foreign key constraint without the NOT NULL requirement
ALTER TABLE transactions 
ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

5. Verifica que la migración se aplicó correctamente:
```sql
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'user_id';
```

Deberías ver `is_nullable = 'YES'`

### Opción 2: Desde terminal local (con psql)

Si tienes la URL de conexión externa de tu BD:

```bash
# Conéctate a la BD
psql "postgresql://usuario:password@dpg-XXXXX.render.com/nombre_bd?ssl=true"

# Ejecuta la migración
\i backend/migrations/005_allow_null_user_id_transactions.sql

# Verifica
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'user_id';
```

### Opción 3: Trigger automático (vía código)

Si prefieres que el backend ejecute la migración automáticamente:

1. Ya está el archivo en `backend/migrations/005_allow_null_user_id_transactions.sql`
2. El backend debería detectarlo al iniciar (si tienes configurado auto-migrations)

## Verificación Post-Migración

Después de ejecutar la migración:

1. **Prueba una compra guest:**
   ```bash
   curl -X POST https://sistema-rifas-backend.onrender.com/api/raffles/1/purchase \
     -H "Content-Type: application/json" \
     -d '{
       "yape_operation_code": "TEST123456",
       "yape_sender_name": "Test User"
     }'
   ```

2. **Resultado esperado:**
   ```json
   {
     "success": true,
     "message": "Compra registrada. Será verificada por un administrador.",
     ...
   }
   ```

3. **Verifica en admin panel:**
   - Login en: https://josebacilio2004.github.io/sistema_rifas/admin.html
   - Deberías ver la transacción pendiente

## Notas Importantes

⚠️ **Esta migración NO afecta datos existentes** - solo cambia el esquema para permitir NULLs futuros

✅ **Es safe para producción** - solo modifica la definición de la columna

🔄 **No requiere downtime** - PostgreSQL hace esto sin bloquear la tabla

## Próximos Pasos

Una vez ejecutada la migración:
1. ✅ Compras de guests funcionarán
2. ✅ Sistema aceptará transacciones con `user_id = NULL`  
3. ⏳ Considerar agregar interfaz de verificación manual en admin panel
