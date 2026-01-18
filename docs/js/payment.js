// Payment Modal Logic with Automatic Yape Verification via Webhook

const paymentModal = document.getElementById('payment-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalRaffleNumber = document.getElementById('modal-raffle-number');
const timerDisplay = document.getElementById('timer-display');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
const codeValidationMessage = document.getElementById('code-validation-message');

let paymentTimer;
let verificationPoller;
let currentRaffleId;
let currentConfirmationCode;
let timeRemaining = 300; // 5 minutes

// Disable confirm button initially
if (confirmPaymentBtn) {
    confirmPaymentBtn.disabled = true;
}

/**
 * Open payment modal for raffle(s) - MANUAL VERIFICATION
 */
function openPaymentModal(raffleIds, confirmationCode, totalAmount) {
    // Support both single raffle and multiple raffles
    const raffleIdsArray = Array.isArray(raffleIds) ? raffleIds : [raffleIds];
    const amount = totalAmount || (raffleIdsArray.length * 5.00);

    currentRaffleId = raffleIdsArray; // Store entire array for multiple raffle purchases
    currentConfirmationCode = confirmationCode;

    // Update raffle numbers display
    if (modalRaffleNumber) {
        modalRaffleNumber.textContent = raffleIdsArray.join(', ');
    }

    // Update amount display
    const amountValue = document.querySelector('.amount-value');
    if (amountValue) {
        amountValue.textContent = `S/ ${amount.toFixed(2)}`;
    }

    // Clear input fields
    const yapeCodeInput = document.getElementById('yape-code');
    const yapeSenderInput = document.getElementById('yape-sender');
    if (yapeCodeInput) yapeCodeInput.value = '';
    if (yapeSenderInput) yapeSenderInput.value = '';

    // ALWAYS enable confirm button (manual verification)
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = false;
    }

    // Generate QR code
    generateQRCode(raffleIdsArray[0]);

    // Start timer
    startPaymentTimer();

    // NO POLLING - Manual verification only

    // Show modal
    paymentModal.classList.remove('hidden');
}

// Alias for backward compatibility
const showPaymentModal = openPaymentModal;

/**
 * Close payment modal
 */
function closePaymentModal() {
    // Clear timers
    if (paymentTimer) {
        clearInterval(paymentTimer);
    }
    if (verificationPoller) {
        clearInterval(verificationPoller);
    }

    // Hide modal
    paymentModal.classList.add('hidden');

    // Reset
    timeRemaining = 300;
    currentRaffleId = null;
    currentConfirmationCode = null;
}

/**
 * Alias for closePaymentModal (for compatibility)
 */
function hidePaymentModal() {
    closePaymentModal();
}

/**
 * Generate QR code for Yape payment
 */
function generateQRCode(raffleId) {
    const qrCodeContainer = document.getElementById('qr-code');

    // Clear previous QR
    qrCodeContainer.innerHTML = '';

    // Use static Yape QR image for +51 964 910 248
    const qrImagePath = 'assets/yapeQR/QR.jpeg';

    qrCodeContainer.innerHTML = `
        <div style="text-align: center;">
            <img src="${qrImagePath}" alt="Yape QR" style="max-width: 250px; border-radius: 8px;">
            <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-secondary);">
                Escanea el cÃ³digo QR con Yape
            </p>
            <p style="font-weight: 600; color: var(--color-primary);">
                NÃºmero: +51 964 910 248
            </p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                Monto: S/ 5.00
            </p>
        </div>
    `;
}

/**
 * Start payment timer
 */
function startPaymentTimer() {
    timeRemaining = 300; // Reset to 5 minutes
    updateTimerDisplay();

    paymentTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(paymentTimer);
            clearInterval(verificationPoller);
            showToast('Tiempo de pago expirado. La rifa ha sido liberada.', 'error');
            closePaymentModal();
            loadRaffles(); // Reload raffles
        }
    }, 1000);
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Start polling for payment verification
 * Checks every 5 seconds if the payment has been verified by webhook
 */
function startVerificationPolling() {
    // Clear any existing poller
    if (verificationPoller) {
        clearInterval(verificationPoller);
    }

    // Poll every 5 seconds
    verificationPoller = setInterval(async () => {
        await checkPaymentStatus();
    }, 5000);

    // Also check immediately
    checkPaymentStatus();
}

/**
 * Check payment verification status
 */
async function checkPaymentStatus() {
    if (!currentConfirmationCode) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/payments/check-status/${currentConfirmationCode}`);

        if (response.ok) {
            const data = await response.json();

            if (data.verified) {
                // Payment verified by webhook!
                onPaymentVerified(data);
            } else {
                // Still waiting
                showValidationMessage('â³ Esperando confirmaciÃ³n de pago...', '');
            }
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
    }
}

/**
 * Handle payment verified by webhook
 */
function onPaymentVerified(data) {
    // Stop polling
    clearInterval(verificationPoller);

    // Show success message
    showValidationMessage(
        `âœ… Pago verificado - OperaciÃ³n #${data.yape_operation_code}`,
        'success'
    );

    // Enable confirm button
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = false;
    }

    console.log('âœ… Payment verified:', data);
}

/**
 * Show validation message
 */
function showValidationMessage(message, type) {
    if (codeValidationMessage) {
        codeValidationMessage.textContent = message;
        codeValidationMessage.className = `validation-message ${type}`;
    }
}

/**
 * Confirm payment (complete the purchase) - USES WORKING ENDPOINT
 */
async function confirmPayment() {
    console.log('Confirming payment...');

    // Get Yape verification fields
    const yapeCodeInput = document.getElementById('yape-code');
    const yapeSenderInput = document.getElementById('yape-sender');

    const yapeCode = yapeCodeInput ? yapeCodeInput.value.trim() : '';
    const yapeSender = yapeSenderInput ? yapeSenderInput.value.trim() : '';

    // Validate fields
    if (!yapeCode || !yapeSender) {
        showToast('Por favor completa todos los campos de verificaciÃ³n', 'error');

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
        showToast('El cÃ³digo de operaciÃ³n debe tener al menos 6 caracteres', 'error');
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
        
        console.log(`ðŸ”µ Processing ${raffleIds.length} raffle(s) as BATCH:`, raffleIds);

        const userId = localStorage.getItem('user_id');

        // Use BATCH endpoint (creates ONE transaction for all raffles)
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
        console.log('âœ… BATCH SUCCESS:', data);

        // Clear timers
        clearInterval(paymentTimer);

        // Show success
        const message = `Â¡${data.raffle_count} rifa(s) registrada(s) por S/ ${data.total_amount.toFixed(2)}! SerÃ¡ verificada por un administrador`;
        showToast(message, 'success');

        // Clear cart
        if (typeof clearCart === 'function') {
            clearCart();
        }

        // Close modal and reload
        closePaymentModal();
        loadRaffles();

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

/**
 * Cancel payment
 */
async function cancelPayment() {
    if (confirm('Â¿EstÃ¡s seguro de cancelar este pago? La rifa serÃ¡ liberada.')) {
        try {
            const response = await API.cancelReservation(currentRaffleId);

            if (response.success) {
                clearInterval(paymentTimer);
                clearInterval(verificationPoller);
                showToast('Pago cancelado', 'info');
                closePaymentModal();
                loadRaffles();
            }
        } catch (error) {
            showToast(error.message || 'Error al cancelar', 'error');
        }
    }
}

// Event listeners
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (confirm('Â¿Cancelar el proceso de pago?')) {
            cancelPayment();
        }
    });
}

if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', confirmPayment);
}

if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', cancelPayment);
}

// Close modal when clicking overlay
if (paymentModal) {
    const overlay = paymentModal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (confirm('Â¿Cancelar el proceso de pago?')) {
                cancelPayment();
            }
        });
    }
}

// Make openPaymentModal available globally
window.openPaymentModal = openPaymentModal;
