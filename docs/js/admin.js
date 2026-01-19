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
    const refreshPendingBtn = document.getElementById('refresh-pending-btn');
    if (refreshPendingBtn) {
        refreshPendingBtn.addEventListener('click', loadVerificationsWithFilters);
    }

    // Search and filter event listeners
    const usersSearch = document.getElementById('users-search');
    const usersSort = document.getElementById('users-sort');
    const verificationsSearch = document.getElementById('verifications-search');
    const verificationsStatus = document.getElementById('verifications-status');

    if (usersSearch) {
        usersSearch.addEventListener('input', debounce(loadUsersWithFilters, 500));
    }

    if (usersSort) {
        usersSort.addEventListener('change', loadUsersWithFilters);
    }

    if (verificationsSearch) {
        verificationsSearch.addEventListener('input', debounce(loadVerificationsWithFilters, 500));
    }

    if (verificationsStatus) {
        verificationsStatus.addEventListener('change', loadVerificationsWithFilters);
    }

    // Toggle sales button
    const toggleSalesBtn = document.getElementById('toggle-sales-btn');
    if (toggleSalesBtn) {
        toggleSalesBtn.addEventListener('click', toggleRaffleSales);
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
    adminNameEl.textContent = state.admin.username;
    loadDashboardData();
    loadAnalytics();
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

        // Load raffle sales status
        await loadRaffleSalesStatus();

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

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load users with filters
async function loadUsersWithFilters() {
    try {
        const search = document.getElementById('users-search')?.value || '';
        const sortValue = document.getElementById('users-sort')?.value || 'created_at-DESC';
        const [sortBy, sortOrder] = sortValue.split('-');

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);

        const response = await fetch(`${CONFIG.API_URL}/admin/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error loading users');

        const users = await response.json();

        // Display users in table
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
            `<span class="rifa-number">#${num}</span>`
        ).join('')}
                        ${(user.numeros_rifas || []).filter(n => n !== null).length === 0 ? '<span class="no-rifas">Sin rifas</span>' : ''}
                    </div>
                </td>
                <td><strong>S/ ${parseFloat(user.total_gastado || 0).toFixed(2)}</strong></td>
                <td>${new Date(user.created_at).toLocaleDateString('es-PE')}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users with filters:', error);
        usersTableBody.innerHTML = '<tr><td colspan="7" class="loading">Error al cargar usuarios</td></tr>';
    }
}

// Load verifications with filters
async function loadVerificationsWithFilters() {
    try {
        const search = document.getElementById('verifications-search')?.value || '';
        const status = document.getElementById('verifications-status')?.value || 'pending_verification';

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);

        const response = await fetch(`${CONFIG.API_URL}/admin/pending-verifications?${params}`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error loading verifications');

        const verifications = await response.json();

        // Display in table
        const verificationsTable = document.querySelector('#verifications-table tbody');
        if (!verificationsTable) return;

        if (verifications.length === 0) {
            verificationsTable.innerHTML = '<tr><td colspan="8" class="loading">No hay verificaciones</td></tr>';
            return;
        }

        verificationsTable.innerHTML = verifications.map(v => {
            const createdDate = new Date(v.created_at);
            const dateStr = createdDate.toLocaleDateString('es-PE');
            const timeStr = createdDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

            return `
            <tr>
                <td>${v.nombre} ${v.apellido}</td>
                <td>${v.celular}</td>
                <td>${v.yape_operation_code}</td>
                <td>${v.yape_sender_name}</td>
                <td>S/ ${parseFloat(v.amount).toFixed(2)}</td>
                <td>
                    <div class="rifas-badge">
                        ${(v.raffle_ids || []).map(id => `<span class="rifa-number">#${id}</span>`).join('')}
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.9rem;">
                        <div>${dateStr}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">${timeStr}</div>
                    </div>
                </td>
                <td>
                    <button class="btn-approve" onclick="approvePayment('${v.id}', ${JSON.stringify(v.raffle_ids).replace(/"/g, '&quot;')})">✅ Aprobar</button>
                    <button class="btn-reject" onclick="rejectPayment('${v.id}', ${JSON.stringify(v.raffle_ids).replace(/"/g, '&quot;')})">❌ Rechazar</button>
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading verifications with filters:', error);
    }
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
        `<span class="rifa-number">#${num}</span>`
    ).join('')}
                    ${(user.numeros_rifas || []).filter(n => n !== null).length === 0 ? '<span class="no-rifas">Sin rifas</span>' : ''}
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

        verificationsTableBody.innerHTML = verifications.map(v => {
            // Parse raffle IDs and create badges
            let raffleIds = [];
            if (v.raffle_ids && Array.isArray(v.raffle_ids)) {
                raffleIds = v.raffle_ids.filter(id => id !== null);
            } else if (v.raffle_id) {
                raffleIds = [v.raffle_id];
            }

            const raffleBadges = raffleIds.length > 0
                ? raffleIds.map(id => `<span class="rifa-number">#${id}</span>`).join('')
                : '<span class="no-rifas">N/A</span>';

            return `
                <tr>
                    <td>${new Date(v.created_at).toLocaleString('es-PE')}</td>
                    <td>${v.nombre || 'Guest'} ${v.apellido || ''}<br><small>${v.celular || 'N/A'}</small></td>
                    <td>
                        <div class="rifas-badge">
                            ${raffleBadges}
                        </div>
                    </td>
                    <td><strong>S/ ${parseFloat(v.amount).toFixed(2)}</strong></td>
                    <td><code>${v.yape_operation_code}</code></td>
                    <td>${v.yape_sender_name}</td>
                    <td>
                        <button class="btn-approve" onclick="approvePayment('${v.id}')">✓ Aprobar</button>
                        <button class="btn-reject" onclick="rejectPayment('${v.id}')">✗ Rechazar</button>
                    </td>
                </tr>
            `;
        }).join('');
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

// === NEW ADMIN FUNCTIONALITIES ===

// Modal elements
const resetModal = document.getElementById('reset-modal');
const lotteryModal = document.getElementById('lottery-modal');
const historyModal = document.getElementById('history-modal');

// Buttons
const resetRafflesBtn = document.getElementById('reset-raffles-btn');
const drawWinnerBtn = document.getElementById('draw-winner-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const performDrawBtn = document.getElementById('perform-draw-btn');

// Forms
const resetForm = document.getElementById('reset-form');

// Setup event listeners for new features
if (resetRafflesBtn) {
    resetRafflesBtn.addEventListener('click', openResetModal);
}

if (drawWinnerBtn) {
    drawWinnerBtn.addEventListener('click', openLotteryModal);
}

if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', openHistoryModal);
}

if (resetForm) {
    resetForm.addEventListener('submit', handleResetRaffles);
}

if (performDrawBtn) {
    performDrawBtn.addEventListener('click', performLotteryDraw);
}

// Close modal buttons
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.add('hidden');
    });
});

// === RESET RAFFLES ===

function openResetModal() {
    resetModal.classList.remove('hidden');
}

async function handleResetRaffles(e) {
    e.preventDefault();

    const totalRaffles = parseInt(document.getElementById('total-raffles').value);

    if (!confirm(`¿Estás seguro de reiniciar el sistema con ${totalRaffles} rifas? Esta acción reseteará todas las rifas actuales.`)) {
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/reset-raffles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ totalRaffles })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al reiniciar rifas');
        }

        const data = await response.json();
        alert(`✅ ${data.message}\n\nSorteo #${data.round_number}\nTotal rifas: ${data.total_raffles}`);

        resetModal.classList.add('hidden');
        resetForm.reset();
        await loadDashboardData();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al reiniciar: ' + error.message);
    }
}

// === LOTTERY DRAWING ===

function openLotteryModal() {
    lotteryModal.classList.remove('hidden');
    loadLotteryStats();

    // Reset modal state
    document.getElementById('lottery-animation').classList.add('hidden');
    document.getElementById('winner-result').classList.add('hidden');
    document.getElementById('perform-draw-btn').style.display = 'inline-block';
}

async function loadLotteryStats() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const stats = await response.json();

        document.getElementById('sold-count').textContent = stats.rifas_vendidas || 0;

        // Estimate unique participants (this is approximate)
        const participantsResponse = await fetch(`${CONFIG.API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (participantsResponse.ok) {
            const users = await participantsResponse.json();
            const participants = users.filter(u => (u.rifas_compradas || 0) > 0).length;
            document.getElementById('participants-count').textContent = participants;
        }

    } catch (error) {
        console.error('Error loading lottery stats:', error);
    }
}

async function performLotteryDraw() {
    if (!confirm('¿Realizar el sorteo ahora? Esta acción seleccionará un ganador aleatorio y cerrará la ronda actual.')) {
        return;
    }

    // Hide button and show animation
    document.getElementById('perform-draw-btn').style.display = 'none';
    const animationDiv = document.getElementById('lottery-animation');
    animationDiv.classList.remove('hidden');

    // Animate spinning numbers
    const spinningNumber = document.getElementById('spinning-number');
    const spinInterval = setInterval(() => {
        spinningNumber.textContent = Math.floor(Math.random() * 100) + 1;
    }, 100);

    try {
        // Wait 3 seconds for animation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Perform actual draw
        const response = await fetch(`${CONFIG.API_URL}/admin/draw-winner`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al realizar sorteo');
        }

        const data = await response.json();

        // Stop animation
        clearInterval(spinInterval);
        animationDiv.classList.add('hidden');

        // Show winner
        displayWinner(data);

        // Reload dashboard
        await loadDashboardData();

    } catch (error) {
        clearInterval(spinInterval);
        animationDiv.classList.add('hidden');
        document.getElementById('perform-draw-btn').style.display = 'inline-block';

        console.error('Error:', error);
        alert('❌ Error al realizar sorteo: ' + error.message);
    }
}

function displayWinner(data) {
    const winnerDiv = document.getElementById('winner-result');

    document.getElementById('winner-raffle').textContent = data.raffle_id;
    document.getElementById('winner-name').textContent = `${data.winner.nombre} ${data.winner.apellido}`;
    document.getElementById('winner-dni').textContent = data.winner.dni;
    document.getElementById('winner-phone').textContent = data.winner.celular;

    winnerDiv.classList.remove('hidden');
}

// === HISTORY ===

function openHistoryModal() {
    historyModal.classList.remove('hidden');
    loadRaffleHistory();
}

async function loadRaffleHistory() {
    const historyTableBody = document.querySelector('#history-table tbody');
    historyTableBody.innerHTML = '<tr><td colspan="8" class="loading">Cargando historial...</td></tr>';

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/raffle-history`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar historial');

        const history = await response.json();

        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="8" class="loading">No hay historial de sorteos</td></tr>';
            return;
        }

        historyTableBody.innerHTML = history.map(round => {
            const startDate = new Date(round.started_at).toLocaleDateString('es-PE');
            const endDate = round.ended_at ? new Date(round.ended_at).toLocaleDateString('es-PE') : '-';
            const statusBadge = round.status === 'completed' ? '✅ Completado' :
                round.status === 'active' ? '🔵 Activo' : '❌ Cancelado';

            return `
                <tr>
                    <td><strong>#${round.round_number}</strong></td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td>${round.total_raffles}</td>
                    <td>${round.winner_raffle_id ? `<strong>#${round.winner_raffle_id}</strong>` : '-'}</td>
                    <td>${round.winner_nombre ? `${round.winner_nombre} ${round.winner_apellido}` : '-'}</td>
                    <td>${round.winner_dni || '-'}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        historyTableBody.innerHTML = '<tr><td colspan="8" class="loading">Error al cargar historial</td></tr>';
    }
}

// ============================================
// ANALYTICS DASHBOARD
// ============================================

let salesChart = null;
let hourlyChart = null;

async function loadAnalytics() {
    await Promise.all([
        loadConversionRate(),
        loadSalesTrend(),
        loadTopBuyers(),
        loadHourlyDistribution()
    ]);
}

async function loadConversionRate() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/analytics/conversion`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Error loading conversion rate');

        const data = await response.json();

        document.getElementById('total-users-analytics').textContent = data.total_users || 0;
        document.getElementById('buyers-count').textContent = data.buyers || 0;
        document.getElementById('conversion-rate').textContent = `${data.conversion_rate || 0}%`;
    } catch (error) {
        console.error('Error loading conversion rate:', error);
    }
}

async function loadSalesTrend() {
    try {
        const period = document.getElementById('analytics-period').value;
        const response = await fetch(`${CONFIG.API_URL}/analytics/sales-trend?days=${period}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Error loading sales trend');

        const data = await response.json();

        const labels = data.map(d => new Date(d.date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }));
        const sales = data.map(d => parseInt(d.sales));
        const revenue = data.map(d => parseFloat(d.revenue));

        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;

        if (salesChart) {
            salesChart.destroy();
        }

        salesChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ventas',
                        data: sales,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y',
                        fill: true
                    },
                    {
                        label: 'Ingresos (S/)',
                        data: revenue,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: '#9ca3af',
                            stepSize: 1
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: '#9ca3af' },
                        grid: { drawOnChartArea: false }
                    },
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e5e7eb' }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 27, 75, 0.9)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: '#6366f1',
                        borderWidth: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading sales trend:', error);
    }
}

async function loadTopBuyers() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/analytics/top-buyers?limit=5`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Error loading top buyers');

        const data = await response.json();

        const listHTML = data.length > 0 ? data.map((buyer, index) => `
            <div class="top-buyer-item">
                <span class="rank">#${index + 1}</span>
                <div class="buyer-info">
                    <strong>${buyer.nombre} ${buyer.apellido}</strong>
                    <small>${buyer.rifas_compradas} rifas - S/ ${parseFloat(buyer.total_spent).toFixed(2)}</small>
                </div>
            </div>
        `).join('') : '<p style="color: var(--text-muted); text-align: center;">No hay datos disponibles</p>';

        document.getElementById('top-buyers-list').innerHTML = listHTML;
    } catch (error) {
        console.error('Error loading top buyers:', error);
    }
}

async function loadHourlyDistribution() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/analytics/hourly-distribution`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Error loading hourly distribution');

        const data = await response.json();

        const hourlyData = Array(24).fill(0);
        data.forEach(item => {
            hourlyData[item.hour] = parseInt(item.sales);
        });

        const labels = hourlyData.map((_, index) => `${index}:00`);

        const ctx = document.getElementById('hourlyChart');
        if (!ctx) return;

        if (hourlyChart) {
            hourlyChart.destroy();
        }

        hourlyChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas por Hora',
                    data: hourlyData,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: '#6366f1',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9ca3af',
                            stepSize: 1
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e5e7eb' }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 27, 75, 0.9)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: '#6366f1',
                        borderWidth: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading hourly distribution:', error);
    }
}

const analyticsPeriodSelect = document.getElementById('analytics-period');
if (analyticsPeriodSelect) {
    analyticsPeriodSelect.addEventListener('change', () => {
        loadSalesTrend();
    });
}

// ============================================
// REPORTS EXPORT
// ============================================

function exportUsersCSV() {
    const url = `${CONFIG.API_URL}/reports/users/csv`;
    downloadFile(url, 'usuarios.csv');
}

function exportTransactionsCSV() {
    const status = document.getElementById('transaction-status-filter').value;
    const dateFrom = document.getElementById('transaction-date-from').value;
    const dateTo = document.getElementById('transaction-date-to').value;

    let url = `${CONFIG.API_URL}/reports/transactions/csv?`;
    if (status) url += `status=${status}&`;
    if (dateFrom) url += `date_from=${dateFrom}&`;
    if (dateTo) url += `date_to=${dateTo}&`;

    downloadFile(url, 'transacciones.csv');
}

function exportSalesPDF() {
    const dateFrom = document.getElementById('sales-date-from').value;
    const dateTo = document.getElementById('sales-date-to').value;

    let url = `${CONFIG.API_URL}/reports/sales/pdf?`;
    if (dateFrom) url += `date_from=${dateFrom}&`;
    if (dateTo) url += `date_to=${dateTo}&`;

    downloadFile(url, 'reporte-ventas.pdf');
}

function downloadFile(url, filename) {
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al descargar el archivo');
            return response.blob();
        })
        .then(blob => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        })
        .catch(error => {
            console.error('Error downloading file:', error);
            alert('Error al descargar el archivo');
        });
}
