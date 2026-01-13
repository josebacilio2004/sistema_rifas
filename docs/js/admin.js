// Panel de Administración - JavaScript

const state = {
    token: null,
    admin: null
};

// Elementos del DOM
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-btn');
const adminNameEl = document.getElementById('admin-name');

// Stats elements
const totalUsersEl = document.getElementById('total-users');
const rifasVendidasEl = document.getElementById('rifas-vendidas');
const rifasDisponiblesEl = document.getElementById('rifas-disponibles');
const totalRecaudadoEl = document.getElementById('total-recaudado');
const usersTableBody = document.querySelector('#users-table tbody');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    refreshBtn.addEventListener('click', loadDashboardData);
}

function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const admin = localStorage.getItem('admin_data');

    if (token && admin) {
        state.token = token;
        state.admin = JSON.parse(admin);
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
}

function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    adminNameEl.textContent = `Bienvenido/a, ${state.admin.nombre}`;
    loadDashboardData();
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }

        // Guardar token y datos del admin
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_data', JSON.stringify(data.admin));

        state.token = data.token;
        state.admin = data.admin;

        loginError.style.display = 'none';
        loginForm.reset();
        showDashboard();

    } catch (error) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
    }
}

function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    state.token = null;
    state.admin = null;
    showLogin();
}

async function loadDashboardData() {
    try {
        // Load stats
        await loadStats();

        // Load users
        await loadUsers();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (error.message.includes('Token')) {
            handleLogout();
        }
    }
}

async function loadStats() {
    const response = await fetch(`${CONFIG.API_URL}/admin/dashboard`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
    }

    const stats = await response.json();

    totalUsersEl.textContent = stats.total_usuarios || 0;
    rifasVendidasEl.textContent = stats.rifas_vendidas || 0;
    rifasDisponiblesEl.textContent = stats.rifas_disponibles || 0;

    const totalRecaudado = parseFloat(stats.total_recaudado) || 0;
    totalRecaudadoEl.textContent = `S/ ${totalRecaudado.toFixed(2)}`;
}

async function loadUsers() {
    usersTableBody.innerHTML = '<tr><td colspan="7" class="loading">Cargando usuarios...</td></tr>';

    const response = await fetch(`${CONFIG.API_URL}/admin/users`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al cargar usuarios');
    }

    const users = await response.json();

    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="7" class="loading">No hay usuarios registrados</td></tr>';
        return;
    }
    
   users TableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.nombre} ${user.apellido}</td>
            <td>${user.dni}</td>
            <td>${user.celular}</td>
            <td><strong>${user.rifas_compradas || 0}</strong></td>
            <td>
                <div class="rifas-badge">
                    ${(user.numeros_rifas || []).filter(n => n !== null).map(num =>
        `<span class="rifa-number">${num}</span>`
    ).join('')}
                    ${(user.numeros_rifas || []).filter(n => n !== null).length === 0 ? '-' : ''}
                </div>
            </td>
            <td><strong>S/ ${(user.total_gastado || 0).toFixed(2)}</strong></td>
            <td>${new Date(user.created_at).toLocaleDateString('es-PE')}</td>
        </tr>
    `).join('');
}
