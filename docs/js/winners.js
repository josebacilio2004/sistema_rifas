// Winners Gallery JavaScript

let winnersData = [];
let currentWinnerSlide = 0;
let winnersAutoplayInterval;

async function loadWinnersGallery() {
    try {
        const apiUrl = window.CONFIG?.API_URL || 'https://sistema-rifas-backend.onrender.com/api';
        const response = await fetch(`${apiUrl}/winners/gallery?limit=10`);

        if (response.ok) {
            winnersData = await response.json();
            if (winnersData.length > 0) {
                renderWinnersCarousel();
                startWinnersAutoplay();
                console.log('✅ Winners gallery loaded');
            } else {
                // No winners yet
                document.getElementById('winners-track').innerHTML = `
                    <div class="winner-slide">
                        <div class="winner-card">
                            <div class="winner-placeholder">
                                <p style="color: var(--text-muted); text-align: center;">
                                    Próximamente verás aquí a nuestros ganadores
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.log('ℹ️ Winners gallery not available yet:', error);
    }
}

function renderWinnersCarousel() {
    const track = document.getElementById('winners-track');
    const dots = document.getElementById('winners-dots');

    if (!track || winnersData.length === 0) return;

    // Render slides
    track.innerHTML = winnersData.map(winner => `
        <div class="winner-slide">
            <div class="winner-card">
                <div class="winner-image">
                    ${winner.winner_photo_url
            ? `<img src="${winner.winner_photo_url}" alt="${winner.winner_nombre}" onerror="this.parentElement.innerHTML='<div class=\\'winner-placeholder\\'>🎉</div>'">`
            : `<div class="winner-placeholder">🎉</div>`
        }
                </div>
                <div class="winner-info">
                    <h3>${winner.winner_nombre} ${winner.winner_apellido}</h3>
                    <p class="winner-prize">${winner.winner_prize_name || 'Premio Especial'}</p>
                    <p class="winner-raffle">Rifa #${winner.winner_raffle_id} - Sorteo #${winner.round_number}</p>
                    ${winner.winner_testimonial
            ? `<blockquote class="winner-testimonial">"${winner.winner_testimonial}"</blockquote>`
            : ''
        }
                    <p class="winner-date">${new Date(winner.ended_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Render dots
    if (dots) {
        dots.innerHTML = winnersData.map((_, index) =>
            `<span class="dot ${index === 0 ? 'active' : ''}" onclick="goToWinnerSlide(${index})"></span>`
        ).join('');
    }

    updateWinnersCarousel();
}

function updateWinnersCarousel() {
    const track = document.getElementById('winners-track');
    const dots = document.querySelectorAll('#winners-dots .dot');

    if (!track || winnersData.length === 0) return;

    track.style.transform = `translateX(-${currentWinnerSlide * 100}%)`;

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentWinnerSlide);
    });
}

function nextWinnerSlide() {
    if (winnersData.length === 0) return;
    currentWinnerSlide = (currentWinnerSlide + 1) % winnersData.length;
    updateWinnersCarousel();
}

function prevWinnerSlide() {
    if (winnersData.length === 0) return;
    currentWinnerSlide = (currentWinnerSlide - 1 + winnersData.length) % winnersData.length;
    updateWinnersCarousel();
}

function goToWinnerSlide(index) {
    if (winnersData.length === 0) return;
    currentWinnerSlide = index;
    updateWinnersCarousel();
}

function startWinnersAutoplay() {
    if (winnersData.length === 0) return;
    winnersAutoplayInterval = setInterval(nextWinnerSlide, 5000);
}

function stopWinnersAutoplay() {
    clearInterval(winnersAutoplayInterval);
}

// Event listeners
const winnersPrevBtn = document.getElementById('winners-prev');
const winnersNextBtn = document.getElementById('winners-next');

if (winnersPrevBtn) {
    winnersPrevBtn.addEventListener('click', () => {
        prevWinnerSlide();
        stopWinnersAutoplay();
        startWinnersAutoplay();
    });
}

if (winnersNextBtn) {
    winnersNextBtn.addEventListener('click', () => {
        nextWinnerSlide();
        stopWinnersAutoplay();
        startWinnersAutoplay();
    });
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadWinnersGallery);
