const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/winners/gallery (público)
router.get('/gallery', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const result = await db.query(`
            SELECT 
                rr.id,
                rr.round_number,
                rr.winner_raffle_id,
                rr.winner_photo_url,
                rr.winner_testimonial,
                rr.winner_prize_name,
                rr.ended_at,
                u.nombre as winner_nombre,
                u.apellido as winner_apellido
            FROM raffle_rounds rr
            LEFT JOIN users u ON rr.winner_user_id = u.id
            WHERE rr.status = 'completed'
                AND rr.winner_user_id IS NOT NULL
            ORDER BY rr.ended_at DESC
            LIMIT $1
        `, [parseInt(limit)]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error loading winners gallery:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/winners/:roundId/details (admin)
router.put('/:roundId/details', verifyToken, isAdmin, async (req, res) => {
    try {
        const { roundId } = req.params;
        const { photo_url, testimonial, prize_name } = req.body;

        const result = await db.query(`
            UPDATE raffle_rounds
            SET 
                winner_photo_url = $1,
                winner_testimonial = $2,
                winner_prize_name = $3
            WHERE id = $4
            RETURNING *
        `, [photo_url, testimonial, prize_name, roundId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Round not found' });
        }

        res.json({
            message: 'Winner details updated successfully',
            round: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating winner details:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
