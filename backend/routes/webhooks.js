const express = require('express');
const router = express.Router();
const db = require('../services/database');

/**
 * POST /api/webhooks/test
 * Test endpoint for n8n webhook
 */
router.post('/test', async (req, res) => {
    console.log('Received webhook test:', req.body);
    res.json({
        message: 'Webhook received successfully',
        received_data: req.body,
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/webhooks/status
 * Get current raffle status (for n8n polling)
 */
router.get('/status', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'available') as available,
                COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
                COUNT(*) FILTER (WHERE status = 'sold') as sold,
                COUNT(*) as total
            FROM raffles
        `);

        const stats = result.rows[0];

        res.json({
            timestamp: new Date().toISOString(),
            stats: {
                available: parseInt(stats.available),
                reserved: parseInt(stats.reserved),
                sold: parseInt(stats.sold),
                total: parseInt(stats.total)
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/webhooks/recent-purchases
 * Get recent purchases (for n8n)
 */
router.get('/recent-purchases', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await db.query(`
            SELECT 
                t.id as transaction_id,
                t.raffle_id,
                t.amount,
                t.created_at,
                t.completed_at,
                u.nombre,
                u.apellido,
                u.dni,
                u.celular
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.status = 'completed'
            ORDER BY t.completed_at DESC
            LIMIT $1
        `, [limit]);

        res.json({
            timestamp: new Date().toISOString(),
            count: result.rows.length,
            purchases: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/webhooks/whatsapp
 * Verificación del webhook de WhatsApp (Meta lo llama al configurar)
 */
router.get('/whatsapp', (req, res) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WhatsApp Webhook verified successfully!');
            res.status(200).send(challenge);
        } else {
            console.log('❌ WhatsApp Webhook verification failed - invalid token');
            res.sendStatus(403);
        }
    } else {
        console.log('❌ WhatsApp Webhook verification failed - missing parameters');
        res.sendStatus(400);
    }
});

/**
 * POST /api/webhooks/whatsapp
 * Recibir eventos de WhatsApp
 */
router.post('/whatsapp', (req, res) => {
    const body = req.body;

    console.log('📩 WhatsApp Webhook received:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
        body.entry?.forEach(entry => {
            const changes = entry.changes;
            changes?.forEach(change => {
                if (change.field === 'messages') {
                    const value = change.value;

                    // Procesar mensajes recibidos
                    if (value.messages) {
                        value.messages.forEach(message => {
                            console.log('📨 Message received:', {
                                from: message.from,
                                type: message.type,
                                timestamp: message.timestamp
                            });
                        });
                    }

                    // Procesar estado de mensajes enviados
                    if (value.statuses) {
                        value.statuses.forEach(status => {
                            console.log('📊 Message status update:', {
                                id: status.id,
                                status: status.status,
                                timestamp: status.timestamp,
                                recipient_id: status.recipient_id
                            });
                        });
                    }
                }
            });
        });

        res.sendStatus(200);
    } else {
        console.log('❌ Unknown webhook object:', body.object);
        res.sendStatus(404);
    }
});

module.exports = router;
