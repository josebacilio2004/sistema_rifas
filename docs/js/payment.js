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
 * Open payment modal for a raffle
 */
function openPaymentModal(raffleId, confirmationCode) {
    currentRaffleId = raffleId;
    currentConfirmationCode = confirmationCode;
    modalRaffleNumber.textContent = raffleId;

    // Reset UI
    if (codeValidationMessage) {
        codeValidationMessage.textContent = '⏳ Esperando confirmación de pago...';
        codeValidationMessage.className = 'validation-message';
    }
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = true;
    }

    // Generate QR code
    generateQRCode(raffleId);

    // Start  timer
    startPaymentTimer();

    // Start verification polling
    startVerificationPolling();

    // Show modal
    paymentModal.classList.remove('hidden');
}

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
                Escanea el código QR con Yape
            </p>
            <p style="font-weight: 600; color: var(--color-primary);">
                Número: +51 964 910 248
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
                showValidationMessage('⏳ Esperando confirmación de pago...', '');
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
        `✅ Pago verificado - Operación #${data.yape_operation_code}`,
        'success'
    );

    // Enable confirm button
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = false;
    }

    console.log('✅ Payment verified:', data);
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
 * Confirm payment (complete the purchase)
 */
async function confirmPayment() {
    try {
        const response = await API.purchaseRaffle(currentRaffleId);

        if (response.success) {
            // Clear timers
            clearInterval(paymentTimer);
            clearInterval(verificationPoller);

            // Show success
            showToast('¡Compra completada exitosamente!', 'success');
            triggerConfetti();

            // Close modal and reload
            closePaymentModal();
            loadRaffles();
        }
    } catch (error) {
        showToast(error.message || 'Error al completar la compra', 'error');
    }
}

/**
 * Cancel payment
 */
async function cancelPayment() {
    if (confirm('¿Estás seguro de cancelar este pago? La rifa será liberada.')) {
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
        if (confirm('¿Cancelar el proceso de pago?')) {
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
            if (confirm('¿Cancelar el proceso de pago?')) {
                cancelPayment();
            }
        });
    }
}

// Make openPaymentModal available globally
window.openPaymentModal = openPaymentModal;
