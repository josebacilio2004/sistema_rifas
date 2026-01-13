const express = require('express');
const router = express.Router();
const db = require('../services/database');
const timerService = require('../services/timer');
const { validateRaffleId } = require('../utils/validators');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// WhatsApp Business API Service
let whatsappService;
try {
    whatsappService = require('../services/whatsappService');
} catch (error) {
    console.log('⚠️  WhatsApp service not configured - notifications disabled');
    whatsappService = null;
}

/**
 * GET /api/raffles
 * Get all raffles with their current status
 */
router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT 
                r.id,
                r.status,
                r.reserved_at,
                r.purchased_at,
                CASE 
                    WHEN r.status = 'reserved' THEN 
                        EXTRACT(EPOCH FROM (r.reserved_at + INTERVAL '5 minutes' - NOW()))::INTEGER
                    ELSE NULL
                END as seconds_remaining
            FROM raffles r
            ORDER BY r.id ASC
        `);

        // Clean up any expired reservations in the response
        const raffles = result.rows.map(raffle => {
            if (raffle.status === 'reserved' && raffle.seconds_remaining <= 0) {
                return { ...raffle, status: 'available', seconds_remaining: null };
            }
            return raffle;
        });

        res.json({ raffles });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/raffles/:id/reserve
 * Reserve a raffle number
 */
router.post('/:id/reserve', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // Validate raffle ID
        const raffleValidation = validateRaffleId(id);
        if (!raffleValidation.valid) {
            return res.status(400).json({ error: raffleValidation.message });
        }

        // Validate user ID
        if (!user_id) {
            return res.status(400).json({ error: 'user_id es requerido' });
        }

        // Use transaction to ensure atomicity
        const result = await db.transaction(async (client) => {
            // Check if raffle is available
            const raffleCheck = await client.query(
                'SELECT id, status, reserved_at FROM raffles WHERE id = $1 FOR UPDATE',
                [raffleValidation.id]
            );

            if (raffleCheck.rows.length === 0) {
                throw new Error('Rifa no encontrada');
            }

            const raffle = raffleCheck.rows[0];

            // If reserved, check if it's expired
            if (raffle.status === 'reserved') {
                const expirationTime = new Date(Date.now() - timerService.RESERVATION_TIMEOUT_MINUTES * 60 * 1000);
                if (new Date(raffle.reserved_at) > expirationTime) {
                    throw new Error('Esta rifa ya está reservada. Por favor, selecciona otra.');
                }
            }

            if (raffle.status === 'sold') {
                throw new Error('Esta rifa ya fue vendida. Por favor, selecciona otra.');
            }

            // Reserve the raffle
            const updateResult = await client.query(
                `UPDATE raffles 
                 SET status = 'reserved', 
                     reserved_by = $1, 
                     reserved_at = NOW() 
                 WHERE id = $2 
                 RETURNING id, status, reserved_at`,
                [user_id, raffleValidation.id]
            );

            return updateResult.rows[0];
        });

        // Send webhook notification
        await timerService.sendWebhookNotification({
            event: 'raffle_reserved',
            raffle_id: result.id,
            user_id: user_id,
            timestamp: new Date().toISOString()
        });

        // Send WhatsApp notification
        if (whatsappService) {
            try {
                const userResult = await db.query(
                    'SELECT nombre, apellido, dni, celular FROM users WHERE id = $1',
                    [user_id]
                );
                if (userResult.rows.length > 0) {
                    await whatsappService.sendReservationNotification(
                        userResult.rows[0],
                        result.id
                    );
                    console.log('✅ WhatsApp reservation notification sent');
                }
            } catch (whatsappError) {
                console.error('❌ WhatsApp notification failed:', whatsappError.message);
                // Don't fail the reservation if WhatsApp fails
            }
        }

        res.json({
            message: 'Rifa reservada exitosamente',
            raffle: {
                id: result.id,
                status: result.status,
                reserved_at: result.reserved_at,
                expires_in_seconds: timerService.RESERVATION_TIMEOUT_MINUTES * 60
            }
        });
    } catch (error) {
        if (error.message.includes('ya está reservada') || error.message.includes('ya fue vendida')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
});

/**
 * POST /api/raffles/:id/purchase
 * Complete purchase of a reserved raffle
 */
router.post('/:id/purchase', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // Validate raffle ID
        const raffleValidation = validateRaffleId(id);
        if (!raffleValidation.valid) {
            return res.status(400).json({ error: raffleValidation.message });
        }

        if (!user_id) {
            return res.status(400).json({ error: 'user_id es requerido' });
        }

        // Use transaction
        const result = await db.transaction(async (client) => {
            // Check if raffle is reserved by this user
            const raffleCheck = await client.query(
                `SELECT id, status, reserved_by, reserved_at 
                 FROM raffles 
                 WHERE id = $1 FOR UPDATE`,
                [raffleValidation.id]
            );

            if (raffleCheck.rows.length === 0) {
                throw new Error('Rifa no encontrada');
            }

            const raffle = raffleCheck.rows[0];

            if (raffle.status !== 'reserved') {
                throw new Error('Esta rifa no está reservada');
            }

            if (raffle.reserved_by !== user_id) {
                throw new Error('Esta rifa está reservada por otro usuario');
            }

            // Check if reservation is still valid
            const isValid = await timerService.isReservationValid(raffleValidation.id);
            if (!isValid) {
                throw new Error('La reserva ha expirado. Por favor, intenta nuevamente.');
            }

            // Get user info for QR code and WhatsApp
            const userResult = await client.query(
                'SELECT nombre, apellido, celular FROM users WHERE id = $1',
                [user_id]
            );

            const user = userResult.rows[0];

            // Generate Yape QR code
            const yapeData = `yape://${process.env.YAPE_PHONE}?amount=5.00&message=Rifa%20No.%20${raffleValidation.id}%20-%20${user.nombre}%20${user.apellido}`;
            const qrCodeDataUrl = await QRCode.toDataURL(yapeData);

            // Create transaction record
            const transactionId = uuidv4();
            await client.query(
                `INSERT INTO transactions (id, user_id, raffle_id, amount, payment_method, status, qr_code_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [transactionId, user_id, raffleValidation.id, 5.00, 'yape', 'pending', qrCodeDataUrl]
            );

            // Mark raffle as sold
            const updateResult = await client.query(
                `UPDATE raffles 
                 SET status = 'sold', 
                     purchased_by = $1, 
                     purchased_at = NOW(),
                     reserved_by = NULL,
                     reserved_at = NULL
                 WHERE id = $2 
                 RETURNING id, status, purchased_at`,
                [user_id, raffleValidation.id]
            );

            return {
                raffle: updateResult.rows[0],
                transaction: {
                    id: transactionId,
                    qr_code_url: qrCodeDataUrl
                },
                user
            };
        });

        // Send webhook notification
        await timerService.sendWebhookNotification({
            event: 'raffle_purchased',
            raffle_id: result.raffle.id,
            user_id: user_id,
            user_name: `${result.user.nombre} ${result.user.apellido}`,
            user_phone: result.user.celular,
            amount: 5.00,
            timestamp: new Date().toISOString()
        });


        // Send WhatsApp notifications (DUAL: Customer + Admin)
        // Each notification is independent - if one fails, the other still sends
        if (whatsappService) {
            // 1. Intentar enviar al CLIENTE
            try {
                try {
                    await whatsappService.sendPurchaseTemplate(
                        result.user,
                        [result.raffle.id],
                        5.00
                    );
                    console.log('✅ WhatsApp customer TEMPLATE sent to:', result.user.celular);
                } catch (templateError) {
                    console.log('⚠️  Template no disponible, usando texto libre');
                    await whatsappService.sendPurchaseNotification(
                        result.user,
                        [result.raffle.id],
                        5.00
                    );
                    console.log('✅ WhatsApp customer TEXT sent to:', result.user.celular);
                }
            } catch (customerError) {
                console.error('❌ Failed to send customer notification:', customerError.message);
                // Don't stop - still try to send admin notification
            }

            // 2. Intentar enviar al ADMIN (independiente del resultado anterior)
            try {
                try {
                    await whatsappService.sendAdminTemplate(
                        result.user,
                        [result.raffle.id],
                        5.00
                    );
                    console.log('✅ WhatsApp admin TEMPLATE sent');
                } catch (templateError) {
                    await whatsappService.sendAdminPurchaseNotification(
                        result.user,
                        [result.raffle.id],
                        5.00
                    );
                    console.log('✅ WhatsApp admin TEXT sent');
                }
            } catch (adminError) {
                console.error('❌ Failed to send admin notification:', adminError.message);
                // Don't fail the purchase if admin notification fails
            }
        }

        res.json({
            message: 'Compra iniciada. Escanea el código QR de Yape para completar el pago.',
            raffle: result.raffle,
            payment: {
                method: 'yape',
                amount: 5.00,
                qr_code: result.transaction.qr_code_url,
                instructions: `Escanea el código QR con tu app de Yape y paga S/ 5.00. En el concepto debe aparecer: Rifa No. ${result.raffle.id}`
            },
            transaction_id: result.transaction.id
        });
    } catch (error) {
        if (error.message.includes('no está reservada') ||
            error.message.includes('reservada por otro') ||
            error.message.includes('expirado')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
});

/**
 * DELETE /api/raffles/:id/cancel
 * Cancel a reservation
 */
router.delete('/:id/cancel', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // Validate raffle ID
        const raffleValidation = validateRaffleId(id);
        if (!raffleValidation.valid) {
            return res.status(400).json({ error: raffleValidation.message });
        }

        if (!user_id) {
            return res.status(400).json({ error: 'user_id es requerido' });
        }

        const result = await db.query(
            `UPDATE raffles 
             SET status = 'available', 
                 reserved_by = NULL, 
                 reserved_at = NULL 
             WHERE id = $1 
             AND reserved_by = $2 
             AND status = 'reserved'
             RETURNING id`,
            [raffleValidation.id, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'No se encontró una reserva activa para este usuario'
            });
        }

        // Send webhook notification
        await timerService.sendWebhookNotification({
            event: 'reservation_cancelled',
            raffle_id: raffleValidation.id,
            user_id: user_id,
            timestamp: new Date().toISOString()
        });

        res.json({
            message: 'Reserva cancelada exitosamente',
            raffle_id: raffleValidation.id
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
