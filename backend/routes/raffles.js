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
            const reservationTimeout = timerService.RESERVATION_TIMEOUT_MINUTES;
            const updateResult = await client.query(
                `UPDATE raffles 
                 SET status = 'reserved', 
                     reserved_by = $1, 
                     reserved_at = NOW(),
                     reserved_until = NOW() + INTERVAL '${reservationTimeout} minutes'
                 WHERE id = $2 
                 RETURNING id, status, reserved_at, reserved_until`,
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
        let { user_id, yape_operation_code, yape_sender_name } = req.body;

        // Validate raffle ID
        const raffleValidation = validateRaffleId(id);
        if (!raffleValidation.valid) {
            return res.status(400).json({ error: raffleValidation.message });
        }

        if (!user_id) {
            user_id = `guest_${Date.now()}`;
            console.log('📝 Generated temporary user_id:', user_id);
        }

        // Validate Yape data (required for manual verification)
        if (!yape_operation_code || !yape_sender_name) {
            return res.status(400).json({
                error: 'Código de operación Yape y nombre del yapero son requeridos'
            });
        }

        // Check for duplicate Yape operation code
        const duplicateCheck = await db.query(
            `SELECT id FROM transactions 
             WHERE yape_operation_code = $1 
             AND status IN ('verified', 'pending_verification')`,
            [yape_operation_code]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'Este código de operación ya fue usado. Verifica tu código.'
            });
        }

        // Use transaction
        const result = await db.transaction(async (client) => {
            // Get current raffle estado
            const raffle = await client.query(
                `SELECT id, status, reserved_by, reserved_at
                 FROM raffles 
                 WHERE id = $1`,
                [raffleValidation.id]
            );

            if (raffle.rows.length === 0) {
                throw new Error('Rifa no encontrada');
            }

            const current = raffle.rows[0];

            // Permitir purchase si NO está sold
            // Esto permite compra directa de available y override de reserved

            if (current.status === 'sold') {
                throw new Error('Esta rifa ya fue vendida');
            }

            // Si está reserved por OTRO usuario (no el mismo), verificar tiempo
            if (current.status === 'reserved' && current.reserved_by && current.reserved_by !== user_id) {
                const reservedAt = new Date(current.reserved_at);
                const now = new Date();
                const secondsSinceReserved = (now - reservedAt) / 1000;

                // Solo bloquear si OTRO usuario la reservó hace MENOS de 1 minuto
                if (secondsSinceReserved < 60) {
                    throw new Error('Esta rifa acaba de ser reservada por otro usuario. Intenta en 1 minuto.');
                }
                // Si > 1 min, permitir override
            }

            // Si está reserved por el MISMO user, permitir (es su propia reserva del carrito)

            // NO marcar como sold todavía - dejar en reserved
            // La rifa se marcará como sold cuando admin apruebe la verificación

            // Create transaction record with Yape data - PENDING VERIFICATION
            // Use NULL for guest users to avoid UUID type error
            const transactionResult = await client.query(
                `INSERT INTO transactions (
                    raffle_id, 
                    user_id, 
                    amount, 
                    payment_method,
                    status, 
                    confirmation_code,
                    yape_operation_code,
                    yape_sender_name,
                    verified_by_webhook,
                    created_at
                 )
                 VALUES ($1, $2, 5.00, 'yape', 'pending_verification', $3, $4, $5, false, NOW())
                 RETURNING id, confirmation_code`,
                [
                    raffleValidation.id,
                    isValidUUID(user_id) ? user_id : null,  // Use NULL for guest users
                    generateConfirmationCode(),
                    yape_operation_code,
                    yape_sender_name
                ]
            );

            return {
                raffle_id: raffleValidation.id,
                transaction: transactionResult.rows[0]
            };
        });

        // Send WhatsApp notification to ADMIN
        // Only if user_id is a valid UUID (not a guest)
        if (whatsappService && isValidUUID(user_id)) {
            try {
                const userResult = await db.query(
                    'SELECT nombre, apellido, dni, celular FROM users WHERE id = $1',
                    [user_id]
                );

                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    const adminMessage = `🔔 *Nueva compra pendiente*\n\n` +
                        `👤 ${user.nombre} ${user.apellido}\n` +
                        `📱 ${user.celular}\n` +
                        `🎟️ Rifa #${raffleValidation.id}\n` +
                        `💰 S/ 5.00\n\n` +
                        `*Datos Yape:*\n` +
                        `📝 Código: ${yape_operation_code}\n` +
                        `👤 Yapero: ${yape_sender_name}\n\n` +
                        `Verifica en admin panel`;

                    await whatsappService.sendMessage('+51964910248', adminMessage);
                    console.log('✅ Admin WhatsApp sent');
                }
            } catch (whatsappError) {
                console.error('❌ Admin WhatsApp failed:', whatsappError.message);
            }
        } else if (!isValidUUID(user_id)) {
            console.log('⚠️ Skipping WhatsApp - guest user (no valid UUID)');
        }

        // Send success response
        res.json({
            success: true,
            message: 'Compra registrada. Será verificada por un administrador.',
            raffle_id: result.raffle_id,
            transaction_id: result.transaction.id,
            confirmation_code: result.transaction.confirmation_code,
            status: 'pending_verification'
        });// Send WhatsApp notifications (DUAL: Customer + Admin)
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

/**
 * Helper to generate confirmation code
 */
function generateConfirmationCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Helper to validate if a string is a valid UUID
 */
function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

module.exports = router;
