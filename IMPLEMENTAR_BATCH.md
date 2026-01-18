# Implementar Endpoint Batch Purchase

## 📝 Instrucciones

### Backend: `backend/routes/raffles.js`

1. **Abre** `backend/routes/raffles.js`
2. **Busca** la línea que dice `POST /api/raffles/:id/purchase` (aproximadamente línea 220-240)
3. **ANTES de esa línea**, pega el código de `NUEVO_ENDPOINT_BATCH.js`

### Frontend: `docs/js/payment.js`

1. **Abre** `docs/js/payment.js`
2. **Busca** la línea 279 que dice: `console.log(\`Processing ${raffleIds.length} raffle(s):\`, raffleIds);`
3. **Reemplaza** desde línea 279 hasta línea ~340 (todo el bloque de loop y errores) con:

```javascript
        console.log(`Processing ${raffleIds.length} raffle(s):`, raffleIds);

        const userId = localStorage.getItem('user_id');

        // Use BATCH endpoint (creates ONE transaction)
        const response = await fetch(`${CONFIG.API_URL}/raffles/purchase-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raffle_ids: raffleIds,
                user_id: userId,
                yape_operation_code: yapeCode,
                yape_sender_name: yapeSender
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar');
        }

        const data = await response.json();
        console.log('✅ Batch OK:', data);

        // Clear timers
        clearInterval(paymentTimer);

        // Show success
        const message = `¡${data.raffle_count} rifa(s) registrada(s) por S/ ${data.total_amount.toFixed(2)}!`;
        showToast(message, 'success');

        // Clear cart
        if (typeof clearCart === 'function') {
            clearCart();
        }

        // Close modal and reload
        closePaymentModal();
        loadRaffles();
```

### Commit y Push

```bash
git add backend/routes/raffles.js docs/js/payment.js
git commit -m "feat: Simple batch purchase endpoint"
git push origin main
```

## ✅ Resultado

- **1 transacción** para 3 rifas
- **1 código Yape** para todas
- **Admin aprueba 1 vez**
- **Sistema simple y funcional**
