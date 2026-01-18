# Aplicar Workaround Temporal

## ⚠️ Este workaround te permite vender INMEDIATAMENTE

**Qué hace:**
- Procesa cada rifa individualmente (3 transacciones separadas para 3 rifas)
- Funciona con el backend actual de Render
- Admin recibe WhatsApp por cada transacción
- **Funciona 100%**

---

## 📝 Pasos para Aplicar

### 1. Abre el archivo
```
docs/js/payment.js
```

### 2. Encuentra la función `confirmPayment()`
Busca la línea **~232** que dice:
```javascript
async function confirmPayment() {
```

### 3. Selecciona TODA la función
- Desde `async function confirmPayment() {` (línea ~232)
- Hasta el cierre `}` (línea ~318)
- Selecciona TODO ese bloque

### 4. Reemplaza con el contenido de
```
docs/js/payment_WORKAROUND.js
```

Copia TODO el contenido de ese archivo y pégalo en lugar de la función original.

### 5. Guarda y despliega
```bash
git add docs/js/payment.js
git commit -m "temp: Workaround - procesar rifas individualmente"
git push origin main
```

### 6. Espera 1 minuto
GitHub Pages desplegará automáticamente.

### 7. Prueba
1. Ctrl+Shift+R (hard refresh)
2. Selecciona 3 rifas
3. Procede al pago
4. Ingresa datos Yape
5. Click "He completado el pago"

**Resultado esperado:**
- ✅ "¡3 rifa(s) registradas por S/ 15.00!"
- ✅ 3 transacciones creadas (una por rifa)
- ✅ Admin recibe 3 WhatsApp
- ✅ Rifas marcadas como reservadas

---

## ✅ Ventajas
- Funciona INMEDIATAMENTE
- No requiere cambios en Render
- Puedes vender mientras investigamos el problema

## ❌ Desventajas
- Crea 3 transacciones separadas (no ideal)
- Admin debe aprobar 3 veces (una por rifa)

---

## 🔄 Revertir Después

Cuando solucionemos el problema de Render:

```bash
git revert HEAD
git push origin main
```

---

## 📞 Soporte

Si tienes problemas aplicando esto, avísame y te ayudo paso a paso.
