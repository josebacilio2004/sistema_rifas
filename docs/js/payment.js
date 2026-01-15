// Payment Modal Logic with Confirmation Code

const paymentModal = document.getElementById('payment-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalRaffleNumber = document.getElementById('modal-raffle-number');
const timerDisplay = document.getElementById('timer-display');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
const confirmCodeInput = document.getElementById('confirmation-code-input');
const codeValidationMessage = document.getElementById('code-validation-message');

let paymentTimer;
let currentRaffleId;
let timeRemaining = 300; // 5 minutes

// Disable confirm button initially
if (confirmPaymentBtn) {
    confirmPaymentBtn.disabled = true;
}

/**
 * Open payment modal for a raffle
 */
function openPaymentModal(raffleId) {
    currentRaffleId = raffleId;
    modalRaffleNumber.textContent = raffleId;

    // Reset confirmation code input
    if (confirmCodeInput) {
        confirmCodeInput.value = '';
        confirmCodeInput.disabled = false;
    }
    if (codeValidationMessage) {
        codeValidationMessage.textContent = '';
        codeValidationMessage.className = 'validation-message';
    }
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = true;
    }

    // Generate QR code
    generateQRCode(raffleId);

    // Start timer
    startPaymentTimer();

    // Show modal
    paymentModal.classList.remove('hidden');
}

/**
 * Close payment modal
 */
function closePaymentModal() {
    // Clear timer
    if (paymentTimer) {
        clearInterval(paymentTimer);
    }

    // Hide modal
    paymentModal.classList.add('hidden');

    // Reset
    timeRemaining = 300;
    currentRaffleId = null;
}

/**
 * Generate QR code for Yape payment
 */
function generateQRCode(raffleId) {
    const qrCodeContainer = document.getElementById('qr-code');

    // Yape URL format: https://yape.com.pe/pago/[phone]?amount=[amount]&message=[message]
    const yapePhone = '51964910248'; // Replace with actual Yape number
    const amount = '5.00';
    const message = encodeURIComponent(`Rifa ${raffleId}`);
    const yapeUrl = `https://yape.com.pe/pago/${yapePhone}?amount=${amount}&message=${message}`;

    // Clear previous QR
    qrCodeContainer.innerHTML = '';

    // Generate QR using qrcodejs or similar library (if loaded)
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrCodeContainer, {
            text: yapeUrl,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
        });
    } else {
        // Fallback: use API service
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(yapeUrl)}`;
        qrCodeContainer.innerHTML = `<img src="${qrApiUrl}" alt="QR Code Yape" style="max-width: 200px;">`;
    }
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
 * Validate confirmation code
 */
async function validateConfirmationCode() {
    const code = confirmCodeInput.value.trim().toUpperCase();

    if (!code) {
        showValidationMessage('Por favor ingresa el código', 'error');
        return false;
    }

    if (code.length < 6) {
        showValidationMessage('El código es muy corto', 'error');
        return false;
    }

    try {
        // Call API to validate code
        const response = await API.validateConfirmationCode(currentRaffleId, code);

        if (response.valid) {
            showValidationMessage('✓ Código válido', 'success');
            confirmCodeInput.disabled = true;
            confirmPaymentBtn.disabled = false;
            return true;
        } else {
            showValidationMessage('✗ Código inválido. Verifica e intenta de nuevo.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error validating code:', error);
        showValidationMessage('Error al validar el código. Intenta nuevamente.', 'error');
        return false;
    }
}

/**
 * Show validation message
 */
function showValidationMessage(message, type) {
    codeValidationMessage.textContent = message;
    codeValidationMessage.className = `validation-message ${type}`;
}

/**
 * Handle confirmation code input
 */
if (confirmCodeInput) {
    // Validate on enter
    confirmCodeInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await validateConfirmationCode();
        }
    });

    // Auto-validate when user types enough characters
    confirmCodeInput.addEventListener('input', async (e) => {
        const code = e.target.value.trim();
        if (code.length >= 6) {
            // Show loading state
            showValidationMessage('Validando...', '');
            await validateConfirmationCode();
        } else {
            showValidationMessage('', '');
            confirmPaymentBtn.disabled = true;
        }
    });
}

/**
 * Confirm payment
 */
async function confirmPayment() {
    try {
        const response = await API.confirmPayment(currentRaffleId);

        if (response.success) {
            // Clear timer
            clearInterval(paymentTimer);

            // Show success
            showToast('¡Pago confirmado exitosamente!', 'success');
            triggerConfetti();

            // Close modal and reload
            closePaymentModal();
            loadRaffles();
        }
    } catch (error) {
        showToast(error.message || 'Error al confirmar el pago', 'error');
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
