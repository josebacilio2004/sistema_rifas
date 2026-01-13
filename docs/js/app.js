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
        showRafflesView();
    }

    // Setup event listeners
    registrationForm.addEventListener('submit', handleRegistration);
    logoutBtn.addEventListener('click', handleLogout);

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
        showRegistrationView();
        showToast('Sesión cerrada', 'info');
    }
}

/**
 * Show registration view
 */
function showRegistrationView() {
    registrationSection.classList.remove('hidden');
    rafflesSection.classList.add('hidden');

    // Clear form
    registrationForm.reset();
}

/**
 * Show raffles view
 */
function showRafflesView() {
    registrationSection.classList.add('hidden');
    rafflesSection.classList.remove('hidden');

    // Display user info
    displayUserInfo();

    // Load raffles
    loadRaffles();
}

/**
 * Display user information
 */
function displayUserInfo() {
    const userInfoDiv = document.getElementById('user-info');
    if (!userInfoDiv || !currentUser) return;

    userInfoDiv.innerHTML = `
        <p><strong>Nombre:</strong> ${currentUser.nombre} ${currentUser.apellido}</p>
        <p><strong>DNI:</strong> ${currentUser.dni}</p>
        <p><strong>Celular:</strong> ${currentUser.celular}</p>
    `;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
