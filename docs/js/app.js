// Main application logic

// State management
let currentUser = null;

// DOM Elements
const registrationSection = document.getElementById('registration-section');
const rafflesSection = document.getElementById('raffles-section');
const registrationForm = document.getElementById('registration-form');
const logoutBtn = document.getElementById('logout-btn');

/**
 * Initialize the application
 */
function init() {
    // Check if user is already registered
    const savedUser = localStorage.getItem('rifaUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        // Ensure user_id is in localStorage (for older sessions)
        if (currentUser.id && !localStorage.getItem('user_id')) {
            localStorage.setItem('user_id', currentUser.id);
        }
    }

    // ALWAYS show raffles view first (no registration required)
    showRafflesView();

    // Setup event listeners
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    console.log('App initialized');
}

/**
 * Handle user registration
 */
async function handleRegistration(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userData = {
        nombre: formData.get('nombre').trim(),
        apellido: formData.get('apellido').trim(),
        dni: formData.get('dni').trim(),
        celular: formData.get('celular').trim()
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
        localStorage.setItem('user_id', currentUser.id);  // Save user_id separately for API calls

        showToast('Registro exitoso. ¡Ahora puedes seleccionar tu rifa!', 'success');

        // Show raffles view
        setTimeout(() => {
            showRafflesView();
        }, 500);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cambiar de usuario?')) {
        currentUser = null;
        localStorage.removeItem('rifaUser');
        localStorage.removeItem('user_id');

        // Clear cart on logout
        if (typeof clearCart === 'function') {
            clearCart();
        }

        showToast('Sesión cerrada', 'info');

        // Reload raffles to refresh state
        if (typeof loadRaffles === 'function') {
            loadRaffles();
        }
    }
}

/**
 * Show registration view
 */
function showRegistrationView() {
    registrationSection.classList.remove('hidden');
    rafflesSection.classList.add('hidden');

    // Clear form
    if (registrationForm) {
        registrationForm.reset();
    }
}

/**
 * Show raffles view
 */
function showRafflesView() {
    registrationSection.classList.add('hidden');
    rafflesSection.classList.remove('hidden');

    // Display user info if logged in
    displayUserInfo();

    // Load raffles
    loadRaffles();
}

/**
 * Display user information
 */
function displayUserInfo() {
    const userInfoDiv = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');

    if (!userInfoDiv) return;

    if (currentUser) {
        userInfoDiv.innerHTML = `
            <p><strong>Usuario:</strong> ${currentUser.nombre} ${currentUser.apellido}</p>
            <p><strong>DNI:</strong> ${currentUser.dni}</p>
            <p><strong>Celular:</strong> ${currentUser.celular}</p>
        `;
        // Show logout button
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
        }
    } else {
        userInfoDiv.innerHTML = `
            <p style="color: #fbbf24; font-weight: 600;">👤 Selecciona tus rifas. Te pediremos tus datos al finalizar.</p>
        `;
        // Hide logout button
        if (logoutBtn) {
            logoutBtn.classList.add('hidden');
        }
    }
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
