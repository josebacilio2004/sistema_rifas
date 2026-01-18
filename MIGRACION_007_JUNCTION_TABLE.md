# Migración 007: Junction Table para Compra Múltiple

## Propósito

Permitir que 1 transacción contenga N rifas (compra múltiple).

## Cambios en Base de Datos

### Nueva Tabla: `transaction_raffles`

```sql
CREATE TABLE transaction_raffles (
    id UUID PRIMARY KEY,
    transaction_id UUID → transactions(id),
    raffle_id INTEGER → raffles(id),
    created_at TIMESTAMP,
    UNIQUE(transaction_id, raffle_id)
);
```

**Ejemplo:**
```
Transaction ID: abc-123
├─ Rifa 75
├─ Rifa 76
└─ Rifa 77
Total: S/ 15.00
```

### Modificación: `transactions.raffle_id`

Ahora es **NULLABLE** para permitir transacciones multi-rifa.

## Ejecutar en Neon

1. Ve a https://console.neon.tech
2. SQL Editor
3. Ejecuta el contenido de `007_transaction_raffles_junction.sql`
4. Verifica:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'transaction_raffles';
```

## Impacto

- ✅ Compatible con transacciones existentes (single raffle)
- ✅ Permite compra múltiple nueva funcionalidad
- ✅ Índices para queries rápidas
- ⚠️ **IMPORTANTE:** Ejecutar ANTES de desplegar nuevo backend

## Orden de Ejecución

1. Migration 006 (status constraint) - si aún no ejecutada
2. **Migration 007 (esta)** ← Ejecutar ahora
3. Deploy backend con nuevo endpoint

## Rollback (si necesario)

```sql
DROP TABLE IF EXISTS transaction_raffles CASCADE;
ALTER TABLE transactions ALTER COLUMN raffle_id SET NOT NULL;
```
