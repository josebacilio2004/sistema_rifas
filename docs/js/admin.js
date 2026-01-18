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

    // Verifications refresh
    const refreshVerificationsBtn = document.getElementById('refresh-verifications-btn');
    if (refreshVerificationsBtn) {
        refreshVerificationsBtn.addEventListener('click', loadPendingVerifications);
    }
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

        // Load carousel items
        await loadCarouselItems();

        // Load pending verifications
        await loadPendingVerifications();

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

    usersTableBody.innerHTML = users.map(user => `
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
            <td><strong>S/ ${parseFloat(user.total_gastado || 0).toFixed(2)}</strong></td>
            <td>${new Date(user.created_at).toLocaleDateString('es-PE')}</td>
        </tr>
    `).join('');
}

// === CAROUSEL MANAGEMENT ===

const carouselItemsGrid = document.getElementById('carousel-items');
const carouselModal = document.getElementById('carousel-modal');
const carouselForm = document.getElementById('carousel-form');
const addCarouselBtn = document.getElementById('add-carousel-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Setup event listeners for carousel
if (addCarouselBtn) {
    addCarouselBtn.addEventListener('click', () => openCarouselModal());
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCarouselModal);
}

if (carouselForm) {
    carouselForm.addEventListener('submit', handleCarouselSubmit);
}

async function loadCarouselItems() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/carousel/all`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar items del carrusel');

        const items = await response.json();

        if (items.length === 0) {
            carouselItemsGrid.innerHTML = '<p class="loading">No hay premios en el carrusel</p>';
            return;
        }

        carouselItemsGrid.innerHTML = items.map(item => `
            <div class="carousel-item-card">
                <img src="${item.imagen_url}" alt="${item.titulo}" onerror="this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=Error+Cargando+Imagen'">
                <h3>${item.titulo}</h3>
                <p>${item.descripcion || ''}</p>
                <div class="carousel-item-actions">
                    <button class="btn-edit" onclick="editCarouselItem(${item.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteCarouselItem(${item.id})">Eliminar</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading carousel items:', error);
        carouselItemsGrid.innerHTML = '<p class="loading">Error al cargar items</p>';
    }
}

function openCarouselModal(item = null) {
    const modalTitle = document.getElementById('modal-title');
    const itemIdInput = document.getElementById('carousel-item-id');
    const tituloInput = document.getElementById('carousel-titulo');
    const descripcionInput = document.getElementById('carousel-descripcion');
    const imagenInput = document.getElementById('carousel-imagen');
    const ordenInput = document.getElementById('carousel-orden');

    if (item) {
        modalTitle.textContent = 'Editar Premio del Carrusel';
        itemIdInput.value = item.id;
        tituloInput.value = item.titulo;
        descripcionInput.value = item.descripcion || '';
        imagenInput.value = item.imagen_url;
        ordenInput.value = item.orden;
    } else {
        modalTitle.textContent = 'Agregar Premio al Carrusel';
        carouselForm.reset();
        itemIdInput.value = '';
    }

    carouselModal.classList.remove('hidden');
}

function closeCarouselModal() {
    carouselModal.classList.add('hidden');
    carouselForm.reset();
}

async function handleCarouselSubmit(e) {
    e.preventDefault();

    const itemId = document.getElementById('carousel-item-id').value;
    const data = {
        titulo: document.getElementById('carousel-titulo').value,
        descripcion: document.getElementById('carousel-descripcion').value,
        imagen_url: document.getElementById('carousel-imagen').value,
        orden: parseInt(document.getElementById('carousel-orden').value)
    };

    try {
        const url = itemId
            ? `${CONFIG.API_URL}/carousel/${itemId}`
            : `${CONFIG.API_URL}/carousel`;
        const method = itemId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Error al guardar item');

        closeCarouselModal();
        await loadCarouselItems();
        alert(itemId ? 'Premio actualizado' : 'Premio agregado');

    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar: ' + error.message);
    }
}

async function editCarouselItem(id) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/carousel/all`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        const items = await response.json();
        const item = items.find(i => i.id === id);
        if (item) {
            openCarouselModal(item);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteCarouselItem(id) {
    if (!confirm('¿Estás seguro de eliminar este premio?')) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/carousel/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar');

        await loadCarouselItems();
        alert('Premio eliminado');

    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

// Make functions global
window.editCarouselItem = editCarouselItem;
window.deleteCarouselItem = deleteCarouselItem;

// === PENDING VERIFICATIONS ===

const verificationsTableBody = document.querySelector('#verifications-table tbody');

async function loadPendingVerifications() {
    if (!verificationsTableBody) return;

    verificationsTableBody.innerHTML = '<tr><td colspan="7" class="loading">Cargando pagos pendientes...</td></tr>';

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/pending-verifications`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar verificaciones');

        const verifications = await response.json();

        if (verifications.length === 0) {
            verificationsTableBody.innerHTML = '<tr><td colspan="7" class="loading">No hay pagos pendientes</td></tr>';
            return;
        }

        verificationsTableBody.innerHTML = verifications.map(v => `
            <tr>
                <td>${new Date(v.created_at).toLocaleString('es-PE')}</td>
                <td>${v.nombre || 'Guest'} ${v.apellido || ''}<br><small>${v.celular || 'N/A'}</small></td>
                <td><strong>#${v.raffle_id}</strong></td>
                <td><strong>S/ ${parseFloat(v.amount).toFixed(2)}</strong></td>
                <td><code>${v.yape_operation_code}</code></td>
                <td>${v.yape_sender_name}</td>
                <td>
                    <button class="btn-approve" onclick="approvePayment('${v.id}')">✓ Aprobar</button>
                    <button class="btn-reject" onclick="rejectPayment('${v.id}')">✗ Rechazar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading pending verifications:', error);
        verificationsTableBody.innerHTML = '<tr><td colspan="7" class="loading">Error al cargar</td></tr>';
    }
}

async function approvePayment(transactionId) {
    if (!confirm('¿Aprobar este pago? La rifa se marcará como vendida.')) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/approve-payment/${transactionId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error al aprobar pago');

        const data = await response.json();
        alert(data.message);

        // Reload dashboard
        await loadDashboardData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al aprobar: ' + error.message);
    }
}

async function rejectPayment(transactionId) {
    const reason = prompt('¿Razón del rechazo? (opcional):');
    if (reason === null) return; // User cancelled

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/reject-payment/${transactionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) throw new Error('Error al rechazar pago');

        const data = await response.json();
        alert(data.message);

        // Reload dashboard
        await loadDashboardData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al rechazar: ' + error.message);
    }
}

// Make functions global
window.approvePayment = approvePayment;
window.rejectPayment = rejectPayment;
