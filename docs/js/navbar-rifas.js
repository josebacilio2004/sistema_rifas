// Navbar Auto-Hide y efectos para rifas.html

let lastScrollTop = 0;
let scrollProgress = 0;
const navbar = document.querySelector('.navbar-rifas');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Auto-hide: Ocultar al bajar, mostrar al subir
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
    }

    // Agregar clase scrolled
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Progress bar
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    scrollProgress = (scrollTop / windowHeight) * 100;
    navbar.style.setProperty('--scroll-progress', scrollProgress + '%');

    lastScrollTop = scrollTop;
});

// Crear partículas decorativas en navbar
function createNavParticles() {
    const navContainer = document.querySelector('.navbar-rifas .nav-container');
    if (!navContainer) return;

    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'nav-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '50%';
        navContainer.appendChild(particle);

        setTimeout(() => particle.remove(), 4000);
    }, 2000);
}

// Inicializar efectos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNavParticles);
} else {
    createNavParticles();
}
