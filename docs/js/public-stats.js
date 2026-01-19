// Public Statistics JavaScript

async function loadPublicStats() {
    try {
        const apiUrl = window.CONFIG?.API_URL || 'https://sistema-rifas-backend.onrender.com/api';
        const response = await fetch(`${apiUrl}/public/stats`);

        if (response.ok) {
            const stats = await response.json();

            // Update participant count
            animateNumber('stat-participants', stats.total_participants);

            // Update sold raffles
            animateNumber('stat-sold', stats.sold_raffles);

            // Update available raffles
            animateNumber('stat-available', stats.available_raffles);

            // Update progress bar
            const progressFill = document.getElementById('progress-fill');
            const progressPercentage = document.getElementById('progress-percentage');

            if (progressFill && progressPercentage) {
                setTimeout(() => {
                    progressFill.style.width = `${stats.progress_percentage}%`;
                    progressPercentage.textContent = `${stats.progress_percentage}%`;
                }, 300);
            }

            // Update last winner if exists
            if (stats.last_winner) {
                const winnerStat = document.getElementById('last-winner-stat');
                const winnerName = document.getElementById('winner-name');
                const winnerDetails = document.getElementById('winner-details');

                if (winnerStat && winnerName && winnerDetails) {
                    winnerName.textContent = `${stats.last_winner.nombre} ${stats.last_winner.apellido}`;
                    winnerDetails.textContent = `Rifa #${stats.last_winner.raffle_id} - Sorteo #${stats.last_winner.round_number}`;
                    winnerStat.style.display = 'flex';
                }
            }

            console.log('✅ Public stats loaded');
        }
    } catch (error) {
        console.log('ℹ️ Public stats not available:', error);
    }
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), targetValue);
        element.textContent = current;

        if (step >= steps) {
            clearInterval(timer);
            element.textContent = targetValue;
        }
    }, duration / steps);
}

// Load stats on page load
document.addEventListener('DOMContentLoaded', loadPublicStats);

// Refresh stats every 30 seconds
setInterval(loadPublicStats, 30000);
