const express = require('express');
const db = require('../services/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/payments/generate-code
 * Generar código de confirmación para pago
 */
router.post('/generate-code', verifyToken, async (req, res, next) => {
    try {
        const { raffle_ids, user_id } = req.body;

        if (!Array.isArray(raffle_ids) || raffle_ids.length === 0) {
            return res.status(400).json({ error: 'raffle_ids es requerido y debe ser un array' });
        }

        if (!user_id) {
            return res.status(400).json({ error: 'user_id es requerido' });
        }

        const transactions = [];

        // Crear transacción por cada rifa
        for (const raffle_id of raffle_ids) {
            const result = await db.query(
                `INSERT INTO transactions (user_id, raffle_id, amount, payment_method, status)
                 VALUES ($1, $2, 5.00, 'yape', 'pending')
                 RETURNING id, confirmation_code, created_at`,
                [user_id, raffle_id]
            );
            transactions.push(result.rows[0]);
        }

        res.json({
            message: 'Códigos de confirmación generados',
            transactions
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/payments/verify
 * Verificar pago (Solo Admin)
 */
router.post('/verify', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { confirmation_code } = req.body;

        if (!confirmation_code) {
            return res.status(400).json({ error: 'confirmation_code es requerido' });
        }

        await db.transaction(async (client) => {
            // Buscar y verificar transacción
            const txResult = await client.query(
                `UPDATE transactions 
                 SET verified = true, 
                     verified_at = NOW(), 
                     verified_by = $1, 
                     status = 'completed'
                 WHERE confirmation_code = $2 AND verified = false
                 RETURNING *`,
                [req.user.id, confirmation_code.toUpperCase()]
            );

            if (txResult.rows.length === 0) {
                throw new Error('Código inválido o ya verificado');
            }

            const transaction = txResult.rows[0];

            // Marcar rifa como vendida
            await client.query(
                `UPDATE raffles 
                 SET status = 'sold', 
                     purchased_by = $1, 
                     purchased_at = NOW(),
                     reserved_by = NULL,
                     reserved_at = NULL,
                     reserved_until = NULL
                 WHERE id = $2`,
                [transaction.user_id, transaction.raffle_id]
            );
        });

        res.json({ message: 'Pago verificado exitosamente' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/pending
 * Obtener pagos pendientes de verificación (Solo Admin)
 */
router.get('/pending', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const pending = await db.query(`
            SELECT 
                t.id,
                t.confirmation_code,
                t.amount,
                t.created_at,
                t.raffle_id,
                u.nombre,
                u.apellido,
                u.celular,
                u.dni
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.verified = false AND t.status = 'pending'
            ORDER BY t.created_at DESC
        `);

        res.json(pending.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/transaction/:code
 * Obtener detalles de transacción por código
 */
router.get('/transaction/:code', async (req, res, next) => {
    try {
        const { code } = req.params;

        const result = await db.query(`
            SELECT 
                t.*,
                u.nombre,
                u.apellido,
                u.celular
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.confirmation_code = $1
        `, [code.toUpperCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
