// Sales Status Manager
// Checks if raffle sales are enabled and disables UI accordingly

let salesEnabled = true;

// Check sales status from backend
async function checkRaffleSalesStatus() {
    try {
        // Try to get status from a public endpoint
        const response = await fetch(`${CONFIG.API_URL}/public/sales-status`);

        if (response.ok) {
            const data = await response.json();
            salesEnabled = data.sales_enabled !== false;
        }

        // If sales are disabled, block the UI
        if (!salesEnabled) {
            disableRaffleSelection();
            showSalesDisabledMessage();
        }

        return salesEnabled;
    } catch (error) {
        console.error('Error checking sales status:', error);
        // Default to enabled if can't check
        return true;
    }
}

// Disable all raffle selection
function disableRaffleSelection() {
    // Disable all raffle number buttons
    const raffleNumbers = document.querySelectorAll('.raffle-number:not(.sold)');
    raffleNumbers.forEach(raffle => {
        raffle.classList.add('disabled-sales');
        raffle.style.opacity = '0.5';
        raffle.style.cursor = 'not-allowed';
        raffle.style.pointerEvents = 'none';
        raffle.style.filter = 'grayscale(50%)';
    });

    // Disable purchase button if exists
    const purchaseBtn = document.getElementById('purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
        purchaseBtn.style.opacity = '0.5';
        purchaseBtn.style.cursor = 'not-allowed';
    }
}

// Show sales disabled message
function showSalesDisabledMessage() {
    const container = document.querySelector('.raffles-container') || document.querySelector('.container');
    if (!container || document.getElementById('sales-disabled-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'sales-disabled-banner';
    banner.style.cssText = `
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 24px;
        border-radius: 16px;
        text-align: center;
        margin: 20px 0;
        font-weight: 600;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        animation: slideDown 0.5s ease-out;
    `;
    banner.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 12px;">🚫</div>
        <div style="font-size: 1.3rem; margin-bottom: 8px;">Ventas Temporalmente Deshabilitadas</div>
        <div style="font-size: 1rem; opacity: 0.95; line-height: 1.5;">
            Las ventas de rifas están actualmente deshabilitadas.<br>
            El sorteo ya se realizó o está en proceso.
        </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    container.insertBefore(banner, container.firstChild);
}

// Override selectRaffle function if sales are disabled
const originalSelectRaffle = window.selectRaffle;
window.selectRaffle = function (raffleId) {
    if (!salesEnabled) {
        alert('Las ventas de rifas están actualmente deshabilitadas. El sorteo ya se realizó o está en proceso.');
        return;
    }

    if (originalSelectRaffle) {
        originalSelectRaffle(raffleId);
    }
};

// Check status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(checkRaffleSalesStatus, 500);
});

// Export for use in other scripts
window.checkRaffleSalesStatus = checkRaffleSalesStatus;
window.isSalesEnabled = () => salesEnabled;
