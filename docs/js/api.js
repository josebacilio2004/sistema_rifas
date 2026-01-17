// API Client for backend communication

const API = {
    /**
     * Make a fetch request to the API
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            showLoading();
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la solicitud');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    },

    /**
     * Register a new user
     */
    async registerUser(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Get user by DNI
     */
    async getUserByDNI(dni) {
        return this.request(`/auth/user/${dni}`);
    },

    /**
     * Get all raffles
     */
    async getRaffles() {
        return this.request('/raffles');
    },

    /**
     * Reserve a raffle number
     */
    async reserveRaffle(raffleId, userId) {
        return this.request(`/raffles/${raffleId}/reserve`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
    },

    /**
     * Purchase a raffle
     */
    async purchaseRaffle(raffleId, yapeData = {}) {
        const userId = localStorage.getItem('user_id');
        const body = {
            user_id: userId,
            ...yapeData  // Include yape_operation_code and yape_sender_name if provided
        };

        return this.request(`/raffles/${raffleId}/purchase`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * Cancel a reservation
     */
    async cancelReservation(raffleId) {
        const userId = localStorage.getItem('user_id');
        return this.request(`/raffles/${raffleId}/cancel`, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: userId })
        });
    }
};

/**
 * Show loading overlay
 */
function showLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.classList.add('hidden');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const titleText = title || {
        success: '¡Éxito!',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
    }[type];

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${titleText}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}
