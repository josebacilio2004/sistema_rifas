require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./services/database');
const timerService = require('./services/timer');

// Import routes
const authRoutes = require('./routes/auth');
const raffleRoutes = require('./routes/raffles');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const carouselRoutes = require('./routes/carousel');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - necesario para Render y rate limiting
app.set('trust proxy', 1);

// CORS configuration - allow multiple origins
const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://josebacilio2004.github.io',
    process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // In production, check against allowedOrigins
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('⚠️  CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - Protección contra abuso
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por ventana
    message: { error: 'Demasiadas peticiones. Por favor, intenta de nuevo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Rifa Backend API'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/raffles', raffleRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/carousel', carouselRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await db.query('SELECT NOW()');
        console.log('✓ Database connected successfully');

        // Start cron job for reservation cleanup (runs every minute)
        cron.schedule('* * * * *', async () => {
            try {
                await timerService.cleanExpiredReservations();
            } catch (error) {
                console.error('Error in reservation cleanup cron:', error);
            }
        });
        console.log('✓ Reservation cleanup scheduler started');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV}`);
            console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || '*'}`);
            console.log(`\n📋 Available endpoints:`);
            console.log(`   POST   /api/auth/register`);
            console.log(`   GET    /api/raffles`);
            console.log(`   POST   /api/raffles/:id/reserve`);
            console.log(`   POST   /api/raffles/:id/purchase`);
            console.log(`   DELETE /api/raffles/:id/cancel`);
            console.log(`   GET    /health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await db.end();
    process.exit(0);
});
