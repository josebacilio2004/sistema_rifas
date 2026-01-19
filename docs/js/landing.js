// Landing Page - JavaScript

// Premios del carrusel - Se cargarán desde la API o usarán imágenes locales
let premios = [];

// Variables del carrusel
let currentSlide = 0;
let totalSlides = 0;

// Elementos DOM
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const availableCountEl = document.getElementById('available-count');

// Premios locales como fallback
const premiosLocales = [
    {
        imagen: 'assets/img/Apple-iPhone-16-Pro.jpg',
        titulo: '📱 iPhone 16 Pro Max 256GB',
        descripcion: 'El último modelo de Apple con todas las funciones premium'
    },
    {
        imagen: 'assets/img/laptop.jpg',
        titulo: '💻 Laptop Gaming MSI',
        descripcion: 'Laptop de alto rendimiento para gaming y trabajo profesional'
    },
    {
        imagen: 'assets/img/ps5.jpg',
        titulo: '🎮 PlayStation 5 + 2 Juegos',
        descripcion: 'Consola PS5 edición estándar con 2 juegos AAA'
    },
    {
        imagen: 'assets/img/smartv.jpg',
        titulo: '📺 Smart TV Samsung 55"',
        descripcion: 'Televisor 4K UHD con tecnología QLED'
    }
];

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await loadPremiosFromAPI();
    createCarouselSlides();
    createCarouselDots();
    setupEventListeners();
    setupHamburgerMenu();
    startCounterUpdates(); // Iniciar contador dinámico

    // Auto-play carousel
    if (totalSlides > 0) {
        setInterval(nextSlide, 5000);
    }
});

// Detener contador cuando el usuario sale de la página
window.addEventListener('beforeunload', stopCounterUpdates);

async function loadPremiosFromAPI() {
    try {
        const apiUrl = window.CONFIG?.API_URL || 'https://sistema-rifas-backend.onrender.com/api';
        const response = await fetch(`${apiUrl}/carousel`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const items = await response.json();
            if (items.length > 0) {
                premios = items.map(item => ({
                    imagen: item.imagen_url,
                    titulo: item.titulo,
                    descripcion: item.descripcion || ''
                }));
                totalSlides = premios.length;
                console.log('✅ Premios cargados desde API');
                return;
            }
        }
    } catch (error) {
        // Silently fall back to local prizes when API is not available
        console.log('ℹ️ Usando premios locales (API no disponible)');
    }

    // Usar premios locales
    premios = premiosLocales;
    totalSlides = premios.length;
}

function createCarouselSlides() {
    if (premios.length === 0) {
        carouselTrack.innerHTML = '<div class="carousel-slide"><p>Cargando premios...</p></div>';
        return;
    }
    carouselTrack.innerHTML = premios.map(premio => `
        <div class="carousel-slide">
            <img src="${premio.imagen}" alt="${premio.titulo}" loading="lazy" 
                 onerror="this.src='https://via.placeholder.com/450x450/667eea/ffffff?text=Premio'">
            <h3>${premio.titulo}</h3>
            <p>${premio.descripcion}</p>
        </div>
    `).join('');
}

function createCarouselDots() {
    if (premios.length === 0) return;

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
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    updateCarousel();
}

function nextSlide() {
    if (totalSlides === 0) return;
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

function prevSlide() {
    if (totalSlides === 0) return;
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

// Auto-update available count every 30 seconds
let counterInterval;

async function loadAvailableCount() {
    try {
        const response = await fetch(`${window.CONFIG?.API_URL || 'https://sistema-rifas-backend.onrender.com/api'}/raffles`);
        if (response.ok) {
            const data = await response.json();
            const raffles = data.raffles || data;
            const available = raffles.filter(r => r.status === 'available').length;

            if (availableCountEl) {
                // Animación de actualización
                if (availableCountEl.textContent !== available.toString()) {
                    availableCountEl.classList.add('updating');
                    setTimeout(() => {
                        availableCountEl.textContent = available;
                        availableCountEl.classList.remove('updating');
                    }, 150);
                } else {
                    availableCountEl.textContent = available;
                }
            }
        }
    } catch (error) {
        // Silently fail - keep current count or show default
        if (availableCountEl && !availableCountEl.textContent) {
            availableCountEl.textContent = '100';
        }
    }
}

// Iniciar auto-actualización
function startCounterUpdates() {
    loadAvailableCount(); // Carga inicial
    counterInterval = setInterval(loadAvailableCount, 30000); // Cada 30 segundos
}

// Detener auto-actualización (útil si el usuario navega)
function stopCounterUpdates() {
    if (counterInterval) {
        clearInterval(counterInterval);
    }
}

// Hamburger menu para móvil
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Cerrar menú al hacer click en un enlace
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

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

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});
