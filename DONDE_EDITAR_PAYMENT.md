# Editar payment.js - Ubicación Exacta

## 📍 Archivo: docs/js/payment.js

## 🔍 Buscar (Línea ~274-278):
```javascript
        // Call purchase API with Yape data
        const response = await API.purchaseRaffle(currentRaffleId, {
            yape_operation_code: yapeCode,
            yape_sender_name: yapeSender
        });
```

## ✏️ Reemplazar TODO ese bloque con:
```javascript
        // Handle both single raffle and multiple raffles from cart
        const raffleIds = Array.isArray(currentRaffleId) ? currentRaffleId : [currentRaffleId];
        
        console.log(`Processing payment for ${raffleIds.length} raffle(s):`, raffleIds);

        // Call new cart/purchase endpoint (single transaction for multiple raffles)
        const response = await fetch(`${CONFIG.API_URL}/cart/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raffle_ids: raffleIds,
                user_id: localStorage.getItem('user_id'),
                yape_operation_code: yapeCode,
                yape_sender_name: yapeSender
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar el pago');
        }

        const data = await response.json();
```

## 📝 También actualiza el mensaje de éxito (línea ~284):

**BUSCAR:**
```javascript
showToast(response.message || '¡Compra registrada! Será verificada por un administrador', 'success');
```

**REEMPLAZAR:**
```javascript
const message = `¡${data.raffle_count} rifa(s) registrada(s) por S/ ${data.total_amount.toFixed(2)}! Será verificada por un administrador`;
showToast(message, 'success');
```

## 🎯 Resumen Total de Cambios:

1. Línea ~274-278: Cambiar llamada a API
2. Línea ~284: Cambiar mensaje de éxito
3. ✅ admin.js: YA HECHO

---

## 💾 Después de editar:

```bash
git add docs/js/payment.js docs/js/admin.js
git commit -m "fix: Frontend para compra múltiple"
git push origin main
```
