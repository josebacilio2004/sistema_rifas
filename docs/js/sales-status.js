// Sales Status Manager
// Checks if raffle sales are enabled and disables UI accordingly

let salesEnabled = true;

// Check sales status from backend
async function checkRaffleSalesStatus() {
    try {
        console.log('🔍 Checking sales status...');

        // Use the raffles endpoint which now includes sales_enabled
        const response = await fetch(`${CONFIG.API_URL}/raffles`);

        if (!response.ok) {
            console.warn('Could not check sales status, defaulting to enabled');
            return true;
        }

        const data = await response.json();
        console.log('📊 Sales status response:', data);

        salesEnabled = data.sales_enabled !== false;
        console.log('✅ Sales enabled:', salesEnabled);

        // If sales are disabled, block the UI
        if (!salesEnabled) {
            console.log('🚫 Disabling raffle selection...');
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
    console.log(`🔒 Disabling ${raffleNumbers.length} raffle numbers`);

    raffleNumbers.forEach(raffle => {
        raffle.classList.add('disabled-sales');
        raffle.style.opacity = '0.5';
        raffle.style.cursor = 'not-allowed';
        raffle.style.pointerEvents = 'none';
        raffle.style.filter = 'grayscale(50%)';

        // Remove click event
        raffle.onclick = null;
    });

    // Disable purchase button if exists
    const purchaseBtn = document.getElementById('cart-checkout');
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
        purchaseBtn.style.opacity = '0.5';
        purchaseBtn.style.cursor = 'not-allowed';
    }
}

// Show sales disabled message
function showSalesDisabledMessage() {
    const container = document.querySelector('.raffles-grid')?.parentElement || document.querySelector('.container');
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
        position: relative;
        z-index: 100;
    `;
    banner.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 12px;">🚫</div>
        <div style="font-size: 1.3rem; margin-bottom: 8px; font-weight: 700;">Ventas Temporalmente Deshabilitadas</div>
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

    // Insert at the top of raffles section
    const rafflesSection = document.getElementById('raffles-section');
    if (rafflesSection) {
        rafflesSection.insertBefore(banner, rafflesSection.firstChild);
    } else {
        container.insertBefore(banner, container.firstChild);
    }
}

// Check status on page load - wait for raffles to load first
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkRaffleSalesStatus, 1000);
    });
} else {
    setTimeout(checkRaffleSalesStatus, 1000);
}

// Export for use in other scripts
window.checkRaffleSalesStatus = checkRaffleSalesStatus;
window.isSalesEnabled = () => salesEnabled;
