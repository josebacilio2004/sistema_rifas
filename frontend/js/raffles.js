// Raffle grid and selection logic

let rafflesData = [];
let refreshInterval = null;

// DOM Elements
const rafflesGrid = document.getElementById('raffles-grid');
const refreshBtn = document.getElementById('refresh-btn');

/**
 * Load all raffles from API
 */
async function loadRaffles() {
    try {
        const response = await API.getRaffles();
        rafflesData = response.raffles;
        renderRaffles();

        // Start auto-refresh
        startAutoRefresh();
    } catch (error) {
        showToast('Error al cargar las rifas', 'error');
        console.error(error);
    }
}

/**
 * Render raffle grid
 */
function renderRaffles() {
    if (!rafflesGrid) return;

    rafflesGrid.innerHTML = '';

    rafflesData.forEach(raffle => {
        const raffleElement = createRaffleElement(raffle);
        rafflesGrid.appendChild(raffleElement);
    });
}

/**
 * Create raffle element
 */
function createRaffleElement(raffle) {
    const div = document.createElement('div');
    div.className = `raffle-number ${raffle.status}`;
    div.setAttribute('data-id', raffle.id);
    div.innerHTML = `<span>${raffle.id}</span>`;

    // Add click handler for available raffles
    if (raffle.status === 'available') {
        div.addEventListener('click', () => handleRaffleClick(raffle.id));

        // Check if in cart and mark as selected
        if (typeof cart !== 'undefined' && cart.includes(raffle.id)) {
            div.classList.add('selected');
        }
    }

    // Add title for reserved raffles
    if (raffle.status === 'reserved' && raffle.seconds_remaining) {
        const minutes = Math.floor(raffle.seconds_remaining / 60);
        const seconds = raffle.seconds_remaining % 60;
        div.title = `Reservado - Expira en ${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (raffle.status === 'sold') {
        div.title = 'Vendido';
    }

    return div;
}

/**
 * Handle raffle click
 */
async function handleRaffleClick(raffleId) {
    const userId = getCurrentUserId();
    if (!userId) {
        showToast('Debes registrarte primero', 'warning');
        return;
    }

    // Add to cart instead of immediate purchase
    const added = addToCart(raffleId);

    if (added) {
        // Visual feedback - mark as selected
        const raffleElement = event.target.closest('.raffle-number');
        if (raffleElement) {
            raffleElement.classList.add('selected');
        }
    }
}

/**
 * Start auto-refresh for raffle status
 */
function startAutoRefresh() {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    // Refresh every 10 seconds
    refreshInterval = setInterval(async () => {
        try {
            const response = await API.getRaffles();
            rafflesData = response.raffles;
            renderRaffles();
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, CONFIG.POLL_INTERVAL);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * Manual refresh handler
 */
async function handleManualRefresh() {
    await loadRaffles();
    showToast('Rifas actualizadas', 'success');
}

// Event listeners
if (refreshBtn) {
    refreshBtn.addEventListener('click', handleManualRefresh);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
