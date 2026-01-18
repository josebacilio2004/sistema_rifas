# Instrucciones de Cambio Frontend

## 📝 Paso a Paso

### CAMBIO 1: payment.js

1. Abre `docs/js/payment.js` en tu editor
2. Busca la función `async function confirmPayment()` (línea ~239)
3. Selecciona TODO el contenido de la función (desde `{` hasta el cierre `}`)
4. Reemplaza con el código de `CAMBIOS_FRONTEND_PAYMENT.txt`
5. Guarda el archivo

**Lo que cambia:**
- ❌ ANTES: Loop que crea transacciones separadas por cada rifa
- ✅ AHORA: 1 llamada a `/cart/purchase` con array de rifas

---

### CAMBIO 2: admin.js

1. Abre `docs/js/admin.js` en tu editor
2. Busca la función `async function loadPendingVerifications()` (línea ~354)
3. Selecciona TODO el contenido de la función
4. Reemplaza con el código de `CAMBIOS_FRONTEND_ADMIN.txt`
5. Guarda el archivo

**Lo que cambia:**
- ❌ ANTES: Muestra `raffle_id` (singular)
- ✅ AHORA: Muestra `raffle_ids.join(', ')` (array: "75, 76, 77")

---

## ✅ Verificar Cambios

Después de hacer los cambios:

```bash
git diff docs/js/payment.js
git diff docs/js/admin.js
```

Deberías ver:
- payment.js: Cambio de ~70 líneas
- admin.js: Cambio de ~10 líneas en display

---

## 🚀 Deploy

Una vez verificados los cambios:

```bash
git add docs/js/payment.js docs/js/admin.js
git commit -m "feat: Frontend para compra múltiple con transacción única"
git push origin main
```

GitHub Pages desplegará automáticamente en ~1 minuto.

---

## ⚠️ Importante

**ANTES de probar** debes ejecutar:
1. Migration 007 en Neon (junction table)
2. Push del backend (ya committed localmente)

**Orden correcto:**
1. Migration 007 en Neon ✅
2. Push backend → Render deploy ✅
3. Cambios frontend (estos) ✅
4. Push frontend → GitHub Pages ✅
5. Probar sistema completo ✅
