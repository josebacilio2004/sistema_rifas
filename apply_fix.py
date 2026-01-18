import re

# Leer el archivo
with open('docs/js/payment.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar el bloque de fetch
old_pattern = r'''        // Handle both single raffle and multiple raffles from cart
        const raffleIds = Array\.isArray\(currentRaffleId\) \? currentRaffleId : \[currentRaffleId\];
        
        console\.log\(`Processing payment for \$\{raffleIds\.length\} raffle\(s\):`, raffleIds\);

        // Call new cart/purchase endpoint \(single transaction for multiple raffles\)
        const response = await fetch\(`\$\{CONFIG\.API_URL\}/raffles/cart/purchase`, \{
            method: 'POST',
            headers: \{
                'Content-Type': 'application/json'
            \},
            body: JSON\.stringify\(\{
                raffle_ids: raffleIds,
                user_id: localStorage\.getItem\('user_id'\),
                yape_operation_code: yapeCode,
                yape_sender_name: yapeSender
            \}\)
        \}\);

        if \(!response\.ok\) \{
            const errorData = await response\.json\(\);
            throw new Error\(errorData\.error \|\| 'Error al procesar el pago'\);
        \}

        const data = await response\.json\(\);

        // Clear timers
        clearInterval\(paymentTimer\);

        // Show success message
        const message = `¡\$\{data\.raffle_count\} rifa\(s\) registrada\(s\) por S/ \$\{data\.total_amount\.toFixed\(2\)\}! Será verificada por un administrador`;
        showToast\(message, 'success'\);

        // Clear cart after successful purchase
        if \(typeof clearCart === 'function'\) \{
            clearCart\(\);
        \}

        // Close modal and reload
        closePaymentModal\(\);
        loadRaffles\(\);'''

new_content = '''        // Handle both single raffle and multiple raffles from cart
        const raffleIds = Array.isArray(currentRaffleId) ? currentRaffleId : [currentRaffleId];
        
        console.log(`🔄 WORKAROUND: Processing ${raffleIds.length} raffle(s) individually:`, raffleIds);

        // WORKAROUND: Process each raffle individually
        const userId = localStorage.getItem('user_id');
        let successCount = 0;
        const errors = [];
        
        for (const raffleId of raffleIds) {
            try {
                console.log(`🔄 Processing raffle ${raffleId}...`);
                
                const response = await fetch(`${CONFIG.API_URL}/raffles/${raffleId}/purchase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
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
                console.log(`✅ Raffle ${raffleId} processed successfully`);
                successCount++;
                
            } catch (error) {
                console.error(`❌ Error with raffle ${raffleId}:`, error);
                errors.push({ raffleId, error: error.message });
            }
        }

        // Clear timers
        clearInterval(paymentTimer);

        // Show results
        if (successCount > 0) {
            const message = successCount === raffleIds.length
                ? `¡${successCount} rifa(s) registrada(s) por S/ ${(successCount * 5).toFixed(2)}! Serán verificadas por un administrador`
                : `${successCount} de ${raffleIds.length} rifa(s) registrada(s)`;
            
            showToast(message, successCount === raffleIds.length ? 'success' : 'warning');

            // Clear cart after successful purchase
            if (typeof clearCart === 'function') {
                clearCart();
            }

            // Close modal and reload
            closePaymentModal();
            loadRaffles();
        }

        // Show errors if any
        if (errors.length > 0) {
            const errorMsg = errors.map(e => `Rifa ${e.raffleId}: ${e.error}`).join('\\n');
            showToast(errorMsg, 'error');
        }

        // Re-enable button if all failed
        if (successCount === 0 && confirmPaymentBtn) {
            confirmPaymentBtn.disabled = false;
            confirmPaymentBtn.innerHTML = '<span>He completado el pago</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>';
        }'''

# Aplicar el reemplazo
if '/raffles/cart/purchase' in content:
    # Buscar el bloque manualmente
    start_marker = "// Handle both single raffle and multiple raffles from cart"
    end_marker = "loadRaffles();"
    
    start_idx = content.find(start_marker)
    if start_idx != -1:
        # Encontrar el final del bloque
        temp_content = content[start_idx:]
        end_idx = temp_content.find(end_marker)
        if end_idx != -1:
            end_idx += len(end_marker)
            # Reemplazar
            content = content[:start_idx] + new_content + content[start_idx + end_idx:]
            
            # Guardar
            with open('docs/js/payment.js', 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ Archivo actualizado exitosamente")
        else:
            print("❌ No se encontró el marcador final")
    else:
        print("❌ No se encontró el marcador inicial")
else:
    print("❌ El archivo ya está actualizado o no contiene el código esperado")
