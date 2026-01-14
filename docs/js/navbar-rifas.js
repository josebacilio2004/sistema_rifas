// Navbar Auto-Hide y efectos para rifas.html - Versión Flotante

let lastScrollTop = 0;
let scrollProgress = 0;
const navbar = document.querySelector('.navbar-rifas');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Auto-hide: Ocultar al bajar, mostrar al subir
    if (scrollTop > lastScrollTop && scrollTop > 150) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
    }

    // Agregar clase scrolled
    if (scrollTop > 100) {
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

// Añadir progress bar al navbar si no existe
document.addEventListener('DOMContentLoaded', () => {
    if (navbar && !navbar.querySelector('.scroll-progress')) {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        navbar.appendChild(progressBar);
    }
});
