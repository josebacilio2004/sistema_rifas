const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/analytics/sales-trend
router.get('/sales-trend', authenticateAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const result = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sales,
                SUM(amount) as revenue
            FROM transactions
            WHERE status = 'approved'
                AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error in sales-trend:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/conversion
router.get('/conversion', authenticateAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(DISTINCT id) as total_users,
                COUNT(DISTINCT CASE WHEN rifas_compradas > 0 THEN id END) as buyers,
                ROUND(
                    COUNT(DISTINCT CASE WHEN rifas_compradas > 0 THEN id END)::numeric / 
                    NULLIF(COUNT(DISTINCT id), 0) * 100, 2
                ) as conversion_rate
            FROM users
        `);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in conversion:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/top-buyers
router.get('/top-buyers', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const result = await db.query(`
            SELECT 
                u.nombre,
                u.apellido,
                u.rifas_compradas,
                COALESCE(SUM(t.amount), 0) as total_spent
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'approved'
            GROUP BY u.id, u.nombre, u.apellido, u.rifas_compradas
            ORDER BY u.rifas_compradas DESC
            LIMIT $1
        `, [parseInt(limit)]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error in top-buyers:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/hourly-distribution
router.get('/hourly-distribution', authenticateAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                EXTRACT(HOUR FROM created_at)::integer as hour,
                COUNT(*) as sales
            FROM transactions
            WHERE status = 'approved'
            GROUP BY hour
            ORDER BY hour
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error in hourly-distribution:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
