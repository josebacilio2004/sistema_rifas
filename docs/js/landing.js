// Landing Page - JavaScript

// Premios del carrusel - Se cargarán desde la API
let premios = [];

// Variables del carrusel
let currentSlide = 0;
let totalSlides = 0;

// Elementos DOM
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const participateBtn = document.getElementById('participate-btn');
const availableCountEl = document.getElementById('available-count');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    createCarouselSlides();
    createCarouselDots();
    setupEventListeners();
    loadAvailableCount();

    // Auto-play carousel
    setInterval(nextSlide, 5000);
});

function createCarouselSlides() {
    carouselTrack.innerHTML = premios.map(premio => `
        <div class="carousel-slide">
            <img src="${premio.imagen}" alt="${premio.titulo}" loading="lazy">
            <h3>${premio.titulo}</h3>
            <p>${premio.descripcion}</p>
        </div>
    `).join('');
}

function createCarouselDots() {
    carouselDots.innerHTML = premios.map((_, index) => `
        <span class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
    `).join('');

    // Event listeners para dots
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            goToSlide(slideIndex);
        });
    });
}

function setupEventListeners() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    participateBtn.addEventListener('click', goToRaffles);
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    updateCarousel();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

function updateCarousel() {
    const offset = -currentSlide * 100;
    carouselTrack.style.transform = `translateX(${offset}%)`;

    // Update dots
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function goToRaffles() {
    // Redireccionar a la página principal de rifas
    window.location.href = 'index.html';
}

async function loadAvailableCount() {
    try {
        const response = await fetch(`${window.CONFIG?.API_URL || 'http://localhost:3000/api'}/raffles`);
        if (response.ok) {
            const raffles = await response.json();
            const available = raffles.filter(r => r.status === 'available').length;
            if (availableCountEl) {
                availableCountEl.textContent = available;
            }
        }
    } catch (error) {
        console.error('Error loading available count:', error);
        // Mantener el valor por defecto de 100
    }
}

// Animación de entrada para elementos
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar tarjetas para animación
document.querySelectorAll('.info-card, .feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});
