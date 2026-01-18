# TEST SIMPLE PARA IDENTIFICAR EL PROBLEMA

## Prueba 1: Verificar qué rifas seleccionaste

**En la consola del navegador (F12), ANTES de hacer checkout:**

```javascript
console.log('Carrito actual:', cart);
```

Esto te mostrará EXACTAMENTE qué rifas están en el carrito.

**Si muestra:** `[1, 2, 3]` → Seleccionaste las rifas 1, 2, 3  
**Si muestra:** `[65, 66, 67]` → Seleccionaste las rifas 65, 66, 67

---

## Prueba 2: Verificar GitHub Pages deployed

1. Abre https://josebacilio2004.github.io/sistema_rifas/js/cart.js
2. Busca línea ~221
3. **Debe decir:**
```javascript
reservations.map(r => r.raffleId),  // Pass actual raffle IDs, not indices
```

**Si dice eso:** GitHub Pages deployó ✅  
**Si NO tiene el comentario:** GitHub Pages NO deployó ❌

---

## Prueba 3: Test directo

1. **Ctrl+Shift+R** (hard refresh)
2. **F12** → Console → `localStorage.clear()`
3. **Recarga** la página
4. **Selecciona SOLO 1 rifa** - por ejemplo la **75**
5. **Consola:** `console.log('Cart:', cart)`
6. **Procede al pago**
7. **Mira la consola:** ¿Qué muestra en "Processing payment"?

**Resultado esperado:** `Processing payment for 1 raffle(s): [75]`  
**Si muestra:** `[1]` → El problema persiste

---

## SI EL PROBLEMA PERSISTE

Entonces necesito aplicar el fix directamente en el código deployed.

**SOLUCIÓN TEMPORAL:** Usar el endpoint viejo (funciona pero crea 1 transacción por rifa):

1. Abre `docs/js/payment.js`
2. Línea 280, CAMBIA esto:
```javascript
const response = await fetch(`${CONFIG.API_URL}/raffles/cart/purchase`, {
```

**POR ESTO:**
```javascript
// TEMP: Usar endpoint viejo para 1 rifa
const response = await fetch(`${CONFIG.API_URL}/raffles/${raffleIds[0]}/purchase`, {
```

3. Guarda, commit, push
4. Esto te permitirá vender MIENTRAS arreglamos el cart

**Hazme saber los resultados de las 3 pruebas!**
