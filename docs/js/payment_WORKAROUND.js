// WORKAROUND: Función confirmPayment que procesa rifas individualmente
// INSTRUCCIONES: Reemplazar la función confirmPayment() en payment.js (línea ~232-318)
// con esta versión

async function confirmPayment() {
    console.log('Confirming payment...');

    // Get Yape verification fields
    const yapeCodeInput = document.getElementById('yape-code');
    const yapeSenderInput = document.getElementById('yape-sender');

    const yapeCode = yapeCodeInput ? yapeCodeInput.value.trim() : '';
    const yapeSender = yapeSenderInput ? yapeSenderInput.value.trim() : '';

    // Validate fields
    if (!yapeCode || !yapeSender) {
        showToast('Por favor completa todos los campos de verificación', 'error');

        // Highlight empty fields
        if (!yapeCode && yapeCodeInput) {
            yapeCodeInput.style.borderColor = '#dc3545';
        }
        if (!yapeSender && yapeSenderInput) {
            yapeSenderInput.style.borderColor = '#dc3545';
        }
        return;
    }

    // Validate code length (at least 6 characters)
    if (yapeCode.length < 6) {
        showToast('El código de operación debe tener al menos 6 caracteres', 'error');
        if (yapeCodeInput) yapeCodeInput.style.borderColor = '#dc3545';
        return;
    }

    // Reset border colors
    if (yapeCodeInput) yapeCodeInput.style.borderColor = '';
    if (yapeSenderInput) yapeSenderInput.style.borderColor = '';

    try {
        // Disable button to prevent double-click
        if (confirmPaymentBtn) {
            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = '<span>Procesando...</span>';
        }

        // Handle both single raffle and multiple raffles from cart
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
                ? `¡${successCount} rifa(s) registrada(s) por S/ ${successCount * 5}.00! Serán verificadas por un administrador`
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
            const errorMsg = errors.map(e => `Rifa ${e.raffleId}: ${e.error}`).join('\n');
            showToast(errorMsg, 'error');
        }

        // Re-enable button if all failed
        if (successCount === 0 && confirmPaymentBtn) {
            confirmPaymentBtn.disabled = false;
            confirmPaymentBtn.innerHTML = '<span>He completado el pago</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>';
        }

    } catch (error) {
        console.error('Error confirming payment:', error);
        showToast(error.message || 'Error al confirmar el pago', 'error');

        // Re-enable button
        if (confirmPaymentBtn) {
            confirmPaymentBtn.disabled = false;
            confirmPaymentBtn.innerHTML = '<span>He completado el pago</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>';
        }
    }
}
