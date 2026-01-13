# 📊 Estado de la Base de Datos

**Fecha:** 2026-01-12
**Base de Datos:** PostgreSQL (Docker)

## 👥 Usuarios Registrados

Actualmente hay **3 usuarios** registrados en el sistema:

| Nombre | Apellido | DNI | Celular | Fecha de Registro |
|--------|----------|-----|---------|-------------------|
| Juan | Pérez | 12345678 | +51987654321 | 2026-01-12 20:53:26 |
| Maria | Gonzalez | 87654321 | +51912345678 | 2026-01-12 21:03:23 |
| Juan | Pérez | 12345678 | +51987654321 | 2026-01-12 20:57:39 |

> ⚠️ **Nota:** Hay usuarios duplicados. Se recomienda agregar validación única en DNI.

## 🎫 Estado de las Rifas

Total de rifas: **100**

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| **Disponible** | 99 | 99% |
| **Vendido** | 1 | 1% |
| **Reservado** | 0 | 0% |

### Detalle:
- ✅ **99 rifas disponibles** para compra
- 💰 **1 rifa vendida** 
- ⏱️ **0 rifas reservadas** actualmente

## 📈 Estadísticas del Sistema

- **Tasa de conversión actual:** 1%
- **Ingresos generados:** S/ 5.00
- **Ingresos potenciales totales:** S/ 500.00 (100 rifas × S/ 5.00)
- **Ingresos restantes posibles:** S/ 495.00

## 🔍 Consultas SQL Útiles

Para verificar el estado de tu base de datos, usa estos comandos:

```bash
# Ver todos los usuarios
docker exec rifa-postgres psql -U rifauser -d rifa_db -c "SELECT * FROM users;"

# Ver estado de rifas
docker exec rifa-postgres psql -U rifauser -d rifa_db -c "SELECT status, COUNT(*) FROM raffles GROUP BY status;"

# Ver rifas vendidas
docker exec rifa-postgres psql -U rifauser -d rifa_db -c "SELECT * FROM raffles WHERE status = 'sold';"

# Ver rifas reservadas con tiempo restante
docker exec rifa-postgres psql -U rifauser -d rifa_db -c "SELECT id, status, reserved_until FROM raffles WHERE status = 'reserved';"

# Limpiar reservas expiradas (manualmente)
docker exec rifa-postgres psql -U rifauser -d rifa_db -c "UPDATE raffles SET status = 'available', reserved_by = NULL, reserved_until = NULL WHERE status = 'reserved' AND reserved_until < NOW();"
```

## 🔒 Backup Recomendaciones

Para hacer backup de tu base de datos:

```bash
# Exportar backup
docker exec rifa-postgres pg_dump -U rifauser rifa_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i rifa-postgres psql -U rifauser rifa_db < backup_20260112.sql
```

## ⚡ Tareas Pendientes

1. ✅ Agregar índice único en columna `dni` de la tabla `users`
2. ✅ Implementar job automático para limpiar reservas expiradas
3. ⏳ Agregar auditoría de cambios de estado de rifas
4. ⏳ Implementar sistema de reportes para administrador

---

**Última actualización:** 2026-01-12 16:14:30
