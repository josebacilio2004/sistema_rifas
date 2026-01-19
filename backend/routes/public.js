const express = require('express');
const router = express.Router();
const db = require('../services/database');

// GET /api/public/stats (público - sin autenticación)
router.get('/stats', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                (SELECT COUNT(DISTINCT id) FROM users) as total_participants,
                (SELECT COUNT(*) FROM raffles WHERE status = 'sold') as sold_raffles,
                (SELECT COUNT(*) FROM raffles WHERE status = 'available') as available_raffles,
                (SELECT COUNT(*) FROM raffles) as total_raffles,
                (
                    SELECT json_build_object(
                        'nombre', u.nombre,
                        'apellido', u.apellido,
                        'raffle_id', rr.winner_raffle_id,
                        'round_number', rr.round_number,
                        'ended_at', rr.ended_at
                    )
                    FROM raffle_rounds rr
                    LEFT JOIN users u ON rr.winner_user_id = u.id
                    WHERE rr.status = 'completed' AND rr.winner_user_id IS NOT NULL
                    ORDER BY rr.ended_at DESC
                    LIMIT 1
                ) as last_winner
        `);

        const stats = result.rows[0];

        // Calculate progress percentage
        const progress = stats.total_raffles > 0
            ? Math.round((stats.sold_raffles / stats.total_raffles) * 100)
            : 0;

        res.json({
            total_participants: parseInt(stats.total_participants) || 0,
            sold_raffles: parseInt(stats.sold_raffles) || 0,
            available_raffles: parseInt(stats.available_raffles) || 0,
            total_raffles: parseInt(stats.total_raffles) || 0,
            progress_percentage: progress,
            last_winner: stats.last_winner || null
        });
    } catch (error) {
        console.error('Error loading public stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
