// Payment modal and countdown timer logic

let paymentTimer = null;
let currentRaffleId = null;

// DOM Elements
const paymentModal = document.getElementById('payment-modal');
const modalRaffleNumber = document.getElementById('modal-raffle-number');
const timerDisplay = document.getElementById('timer-display');
const qrCode = document.getElementById('qr-code');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
const closeModalBtn = document.getElementById('close-modal');

/**
 * Show payment modal
 */
async function showPaymentModal(raffleId) {
    currentRaffleId = raffleId;

    // Update modal content
    if (modalRaffleNumber) {
        modalRaffleNumber.textContent = raffleId;
    }

    // Show modal
    if (paymentModal) {
        paymentModal.classList.remove('hidden');
    }

    // Start countdown timer
    startPaymentTimer();

    // Initiate purchase to get QR code
    try {
        const userId = getCurrentUserId();
        console.log('🛒 Iniciando compra de rifa:', {
            raffleId,
            userId,
            timestamp: new Date().toISOString()
        });

        const response = await API.purchaseRaffle(raffleId, userId);

        console.log('✅ Respuesta de compra recibida:', response);
        console.log('📱 WhatsApp: El backend intentará enviar notificaciones ahora');
        console.log('💡 TIP: Revisa logs del backend con: docker logs rifa-backend --tail 50');

        // Display QR code
        if (qrCode && response.payment.qr_code) {
            qrCode.innerHTML = `<img src="${response.payment.qr_code}" alt="Código QR de Yape">`;
            console.log('✅ Código QR generado y mostrado');
        }
    } catch (error) {
        console.error('❌ Error en compra:', error);
        showToast(error.message, 'error');
        hidePaymentModal();
    }
}

/**
 * Hide payment modal
 */
function hidePaymentModal() {
    if (paymentModal) {
        paymentModal.classList.add('hidden');
    }

    // Stop timer
    stopPaymentTimer();

    // Clear QR code
    if (qrCode) {
        qrCode.innerHTML = '';
    }

    currentRaffleId = null;
}

/**
 * Start payment countdown timer
 */
function startPaymentTimer() {
    let timeRemaining = CONFIG.RESERVATION_TIMEOUT * 60; // Convert to seconds

    // Update display immediately
    updateTimerDisplay(timeRemaining);

    // Stop any existing timer
    stopPaymentTimer();

    // Start new timer
    paymentTimer = setInterval(() => {
        timeRemaining--;

        if (timeRemaining <= 0) {
            stopPaymentTimer();
            handleTimerExpired();
            return;
        }

        updateTimerDisplay(timeRemaining);
    }, 1000);
}

/**
 * Stop payment timer
 */
function stopPaymentTimer() {
    if (paymentTimer) {
        clearInterval(paymentTimer);
        paymentTimer = null;
    }
}

/**
 * Update timer display
 */
function updateTimerDisplay(seconds) {
    if (!timerDisplay) return;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    timerDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

    // Change color when time is running out
    if (seconds <= 60) {
        timerDisplay.style.color = '#ef4444'; // Red
    } else {
        timerDisplay.style.color = 'inherit';
    }
}

/**
 * Handle timer expiration
 */
function handleTimerExpired() {
    showToast('El tiempo de reserva ha expirado', 'warning');
    hidePaymentModal();
    loadRaffles(); // Refresh raffle grid
}

/**
 * Handle payment confirmation
 */
async function handlePaymentConfirmation() {
    // In a real app with payment gateway, you would verify payment here
    // For now, we just show a success message

    console.log('✅ Pago confirmado por el usuario para rifa:', currentRaffleId);
    console.log('📱 Notificaciones de WhatsApp deberían haber sido enviadas');
    console.log('   Para verificar, revisa:');
    console.log('   1. Tu WhatsApp (+51964910248)');
    console.log('   2. docker logs rifa-backend | Select-String "WhatsApp"');

    // Trigger celebration confetti!
    triggerCelebrationConfetti();

    showToast(
        `¡Pago confirmado! Has comprado la rifa N° ${currentRaffleId}. Recibirás una confirmación.`,
        'success'
    );

    hidePaymentModal();

    // Refresh raffles to show updated status
    await loadRaffles();
}

/**
 * Handle payment cancellation
 */
async function handlePaymentCancellation() {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
        return;
    }

    try {
        const userId = getCurrentUserId();
        await API.cancelReservation(currentRaffleId, userId);

        showToast('Reserva cancelada', 'info');
        hidePaymentModal();

        // Refresh raffles
        await loadRaffles();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Event listeners
if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', handlePaymentConfirmation);
}

if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', handlePaymentCancellation);
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hidePaymentModal);
}

// Close modal when clicking overlay
if (paymentModal) {
    paymentModal.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            hidePaymentModal();
        }
    });
}
