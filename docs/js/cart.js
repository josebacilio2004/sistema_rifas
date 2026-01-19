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

    // If user is not registered, show registration modal
    if (!userId) {
        showCheckoutRegistrationModal();
        return;
    }

    // User is registered, proceed with checkout
    await processCheckout(userId);
}

/**
 * Show registration modal at checkout
 */
function showCheckoutRegistrationModal() {
    const modal = document.createElement('div');
    modal.id = 'checkout-registration-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close" onclick="closeCheckoutRegistrationModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            
            <div class="modal-header">
                <h3 class="modal-title">Completa tus datos</h3>
                <p class="modal-subtitle">Para finalizar tu compra, necesitamos tu información</p>
            </div>
            
            <div class="modal-body">
                <form id="checkout-registration-form" class="form">
                    <div class="form-group">
                        <label for="checkout-nombre" class="form-label">Nombre</label>
                        <input type="text" id="checkout-nombre" class="form-input" placeholder="Tu nombre" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="checkout-apellido" class="form-label">Apellido</label>
                        <input type="text" id="checkout-apellido" class="form-input" placeholder="Tu apellido" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="checkout-dni" class="form-label">DNI</label>
                        <input type="text" id="checkout-dni" class="form-input" placeholder="8 dígitos" maxlength="8" pattern="[0-9]{8}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="checkout-celular" class="form-label">Celular</label>
                        <input type="tel" id="checkout-celular" class="form-input" placeholder="+51987654321" value="+51" pattern="\\+51[0-9]{9}" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-large">
                        <span>Continuar al Pago</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Protect +51 prefix from deletion
    const phoneInput = document.getElementById('checkout-celular');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            if (!this.value.startsWith('+51')) {
                this.value = '+51';
            }
        });

        phoneInput.addEventListener('keydown', function (e) {
            const cursorPosition = this.selectionStart;
            // Prevent deletion if cursor is at position 0, 1, 2, or 3 (within +51)
            if (cursorPosition <= 3 && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
            }
        });
    }

    // Handle form submission
    const form = document.getElementById('checkout-registration-form');
    form.addEventListener('submit', handleCheckoutRegistration);

    // Show modal
    setTimeout(() => modal.classList.remove('hidden'), 10);
}

/**
 * Close checkout registration modal
 */
function closeCheckoutRegistrationModal() {
    const modal = document.getElementById('checkout-registration-modal');
    if (modal) {
        modal.classList.add('hidden');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Handle registration at checkout
 */
async function handleCheckoutRegistration(event) {
    event.preventDefault();

    const userData = {
        nombre: document.getElementById('checkout-nombre').value.trim(),
        apellido: document.getElementById('checkout-apellido').value.trim(),
        dni: document.getElementById('checkout-dni').value.trim(),
        celular: document.getElementById('checkout-celular').value.trim()
    };

    // Validate phone format
    if (!userData.celular.startsWith('+51')) {
        userData.celular = '+51' + userData.celular.replace(/^\+?51?/, '');
    }

    try {
        const response = await API.registerUser(userData);
        currentUser = response.user;

        // Save to localStorage
        localStorage.setItem('rifaUser', JSON.stringify(currentUser));
        localStorage.setItem('user_id', currentUser.id);

        // Update user info display
        if (typeof displayUserInfo === 'function') {
            displayUserInfo();
        }

        // Close modal
        closeCheckoutRegistrationModal();

        showToast('Registro exitoso. Procesando compra...', 'success');

        // Proceed with checkout
        await processCheckout(currentUser.id);
    } catch (error) {
        showToast(error.message || 'Error al registrar', 'error');
    }
}

/**
 * Process checkout (reserve raffles and open payment modal)
 */
async function processCheckout(userId) {
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
        if (typeof showPaymentModal === 'function' || typeof openPaymentModal === 'function') {
            const paymentFunc = typeof showPaymentModal === 'function' ? showPaymentModal : openPaymentModal;
            paymentFunc(
                reservations.map(r => r.raffleId),
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

// Make functions globally available
window.closeCheckoutRegistrationModal = closeCheckoutRegistrationModal;

// Initialize cart when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    initializeCart();
}
