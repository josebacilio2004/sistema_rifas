// Configuration for the frontend application
const CONFIG = {
    // API Base URL - change this for production
    API_URL: 'http://localhost:3000/api',

    // Polling interval for raffle updates (in milliseconds)
    POLL_INTERVAL: 10000, // 10 seconds

    // Reservation timer duration (in minutes)
    RESERVATION_TIMEOUT: 5,

    // Yape payment information
    YAPE: {
        phone: '+51987654321',
        name: 'Sistema de Rifas'
    }
};

// For production deployment, uncomment and update:
// if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
//     CONFIG.API_URL = 'https://your-backend-url.onrender.com/api';
// }
