// Shopping Cart functionality for multiple raffle purchases

let cart = [];
const RAFFLE_PRICE = 5.00;

// DOM Elements
const shoppingCart = document.getElementById('shopping-cart');
const cartToggle = document.getElementById('cart-toggle');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItems = document.getElementById('cart-items');
const cartCheckout = document.getElementById('cart-checkout');

/**
 * Initialize cart
 */
function initializeCart() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('raffleCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }

    // Event listeners
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCartPanel);
    }

    if (cartClose) {
        cartClose.addEventListener('click', () => {
            cartPanel.classList.add('hidden');
        });
    }

    if (cartCheckout) {
        cartCheckout.addEventListener('click', handleCartCheckout);
    }
}

/**
 * Toggle cart panel visibility
 */
function toggleCartPanel() {
    cartPanel.classList.toggle('hidden');
}

/**
 * Add raffle to cart
 */
function addToCart(raffleId) {
    // Check if sales are enabled
    if (window.SALES_ENABLED === false) {
        alert('Las ventas de rifas están actualmente deshabilitadas. El sorteo ya se realizó o está en proceso.');
        return false;
    }

    // Check if already in cart
    if (cart.includes(raffleId)) {
        showToast(`La rifa N° ${raffleId} ya está en tu carrito`, 'warning');
        return false;
    }

    cart.push(raffleId);
    saveCart();
    updateCartUI();

    // Small confetti effect
    triggerSmallConfetti();

    showToast(`Rifa N° ${raffleId} agregada al carrito`, 'success');
    return true;
}

/**
 * Remove raffle from cart
 */
function removeFromCart(raffleId) {
    const index = cart.indexOf(raffleId);
    if (index > -1) {
        cart.splice(index, 1);
        saveCart();
        updateCartUI();

        // Update raffle visual state
        const raffleElement = document.querySelector(`.raffle-number[data-id="${raffleId}"]`);
        if (raffleElement) {
            raffleElement.classList.remove('selected');
        }

        showToast(`Rifa N° ${raffleId} eliminada del carrito`, 'info');
    }
}

/**
 * Clear entire cart
 */
function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();

    // Remove selected class from all raffles
    document.querySelectorAll('.raffle-number.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    localStorage.setItem('raffleCart', JSON.stringify(cart));
}

/**
 * Update cart UI
 */
function updateCartUI() {
    const itemCount = cart.length;
    const total = itemCount * RAFFLE_PRICE;

    // Update badge
    if (cartCount) {
        cartCount.textContent = itemCount;
    }

    // Update total
    if (cartTotal) {
        cartTotal.textContent = total.toFixed(2);
    }

    // Update checkout button
    if (cartCheckout) {
        cartCheckout.disabled = itemCount === 0;
    }

    // Show/hide cart
    if (shoppingCart) {
        if (itemCount > 0) {
            shoppingCart.classList.remove('hidden');
        } else {
            shoppingCart.classList.add('hidden');
            cartPanel.classList.add('hidden');
        }
    }

    // Render cart items
    renderCartItems();
}

/**
 * Render cart items
 */
function renderCartItems() {
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>No has seleccionado rifas</p>
            </div>
        `;
        return;
    }

    // Sort cart items numerically
    const sortedCart = [...cart].sort((a, b) => a - b);

    cartItems.innerHTML = sortedCart.map(raffleId => `
        <div class="cart-item" data-raffle-id="${raffleId}">
            <div class="cart-item-info">
                <div class="cart-item-number">${raffleId}</div>
                <span class="cart-item-price">S/ ${RAFFLE_PRICE.toFixed(2)}</span>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${raffleId})">
                🗑️
            </button>
        </div>
    `).join('');
}

/**
 * Handle cart checkout
 */
async function handleCartCheckout() {
    if (cart.length === 0) {
        showToast('Tu carrito está vacío', 'warning');
        return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
        showToast('Debes registrarte primero', 'warning');
        return;
    }

    try {
        // Reserve all raffles in cart
        const reservations = [];
        for (const raffleId of cart) {
            try {
                const response = await API.reserveRaffle(raffleId, userId);
                reservations.push({
                    raffleId: raffleId,
                    confirmationCode: response.confirmation_code
                });
            } catch (error) {
                showToast(`Error reservando rifa N° ${raffleId}: ${error.message}`, 'error');
            }
        }

        if (reservations.length === 0) {
            showToast('No se pudo reservar ninguna rifa', 'error');
            return;
        }

        // Calculate total amount
        const totalAmount = reservations.length * 5.00;

        // Open payment modal with confirmation code and raffle IDs
        if (typeof showPaymentModal === 'function') {
            showPaymentModal(
                reservations.map(r => r.raffleId),  // Pass actual raffle IDs, not indices
                reservations[0].confirmationCode,
                totalAmount
            );
        } else {
            showToast('Error abriendo modal de pago', 'error');
            return;
        }

        // Close cart panel
        cartPanel.classList.add('hidden');

    } catch (error) {
        showToast('Error al procesar el pedido', 'error');
        console.error(error);
    }
}

// Initialize cart when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    initializeCart();
}
