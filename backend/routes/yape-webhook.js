const express = require('express');
const db = require('../services/database');
const router = express.Router();

// Webhook secret for security (should be in .env)
const WEBHOOK_SECRET = process.env.YAPE_WEBHOOK_SECRET || 'change_this_in_production';

/**
 * POST /api/yape/webhook
 * Webhook endpoint called by n8n when Yape payment notification is received via WhatsApp
 * 
 * Expected body:
 * {
 *   "secret": "WEBHOOK_SECRET",
 *   "operation_code": "123456789",
 *   "amount": 5.00,
 *   "sender_name": "Juan Pérez",
 *   "timestamp": "2026-01-15T08:00:00Z"
 * }
 */
router.post('/webhook', async (req, res, next) => {
    try {
        const { secret, operation_code, amount, sender_name, timestamp } = req.body;

        console.log('📥 Yape webhook received:', { operation_code, amount, sender_name });

        // 1. Validate webhook secret
        if (secret !== WEBHOOK_SECRET) {
            console.error('❌ Invalid webhook secret');
            return res.status(401).json({ error: 'Invalid secret' });
        }

        // 2. Validate required fields
        if (!operation_code || !amount || !sender_name) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ error: 'Missing required fields: operation_code, amount, sender_name' });
        }

        // 3. Validate timestamp (reject if > 5 minutes old)
        if (timestamp) {
            const messageTime = new Date(timestamp);
            const now = new Date();
            const diffMinutes = (now - messageTime) / 1000 / 60;

            if (diffMinutes > 5) {
                console.warn('⚠️ Webhook timestamp too old:', diffMinutes, 'minutes');
                return res.status(400).json({ error: 'Webhook timestamp too old' });
            }
        }

        // 4. Check if operation_code already used
        const existingCheck = await db.query(
            'SELECT id FROM transactions WHERE yape_operation_code = $1',
            [operation_code]
        );

        if (existingCheck.rows.length > 0) {
            console.warn('⚠️ Operation code already used:', operation_code);
            return res.status(409).json({
                error: 'Operation code already used',
                transaction_id: existingCheck.rows[0].id
            });
        }

        // 5. Find pending transaction with matching amount
        const pendingTransaction = await db.query(
            `SELECT id, raffle_id, user_id, confirmation_code, amount
             FROM transactions 
             WHERE status = 'pending' 
             AND amount = $1
             AND verified_by_webhook = false
             AND created_at > NOW() - INTERVAL '10 minutes'
             ORDER BY created_at DESC
             LIMIT 1`,
            [amount]
        );

        if (pendingTransaction.rows.length === 0) {
            console.warn('⚠️ No matching pending transaction for amount:', amount);
            return res.status(404).json({
                error: 'No pending transaction found for this amount',
                amount: amount
            });
        }

        const transaction = pendingTransaction.rows[0];

        // 6. Update transaction with Yape verification data
        const updateResult = await db.query(
            `UPDATE transactions 
             SET yape_operation_code = $1,
                 yape_sender_name = $2,
                 verified_by_webhook = true,
                 webhook_verified_at = NOW()
             WHERE id = $3
             RETURNING id, confirmation_code, raffle_id`,
            [operation_code, sender_name, transaction.id]
        );

        const updated = updateResult.rows[0];

        console.log('✅ Transaction verified:', {
            transaction_id: updated.id,
            confirmation_code: updated.confirmation_code,
            operation_code: operation_code
        });

        // 7. Send success response
        res.json({
            success: true,
            transaction_id: updated.id,
            confirmation_code: updated.confirmation_code,
            raffle_id: updated.raffle_id,
            message: 'Pago verificado exitosamente'
        });

    } catch (error) {
        console.error('💥 Yape webhook error:', error);
        next(error);
    }
});

/**
 * GET /api/yape/test
 * Test endpoint to verify webhook is working
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Yape webhook endpoint is running',
        webhook_enabled: !!process.env.YAPE_WEBHOOK_SECRET
    });
});

module.exports = router;
