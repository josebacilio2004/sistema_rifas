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
    console.log('âš ï¸  WhatsApp service not configured - notifications disabled');
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

        // Check sales status
        const configResult = await db.query('SELECT sales_enabled FROM raffle_system_config LIMIT 1');
        const salesEnabled = configResult.rows.length > 0 ? configResult.rows[0].sales_enabled : true;

        res.json({ raffles, sales_enabled: salesEnabled });
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
                    throw new Error('Esta rifa ya estÃ¡ reservada. Por favor, selecciona otra.');
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
                    console.log('âœ… WhatsApp reservation notification sent');
                }
            } catch (whatsappError) {
                console.error('âŒ WhatsApp notification failed:', whatsappError.message);
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
        if (error.message.includes('ya estÃ¡ reservada') || error.message.includes('ya fue vendida')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
});

/**
 * POST /api/raffles/purchase-batch
 * Purchase multiple raffles in ONE transaction
 */
router.post('/purchase-batch', async (req, res, next) => {
    try {
        const { raffle_ids, user_id, yape_operation_code, yape_sender_name } = req.body;

        console.log('🔵 Batch purchase request:', { raffle_ids, user_id, yape_operation_code, yape_sender_name });

        // Check if raffle sales are enabled
        const configResult = await db.query('SELECT sales_enabled FROM raffle_system_config LIMIT 1');

        if (configResult.rows.length > 0 && !configResult.rows[0].sales_enabled) {
            console.log('❌ Sales disabled');
            return res.status(403).json({
                error: 'Las ventas de rifas están actualmente deshabilitadas. El sorteo ya se realizó o está en proceso.'
            });
        }

        // Validate input
        if (!Array.isArray(raffle_ids) || raffle_ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos una rifa' });
        }
        if (!yape_operation_code || !yape_sender_name) {
            return res.status(400).json({ error: 'Código Yape y nombre requeridos' });
        }

        // Convert to integers
        const raffleIdsInt = raffle_ids.map(id => {
            const num = parseInt(id);
            if (isNaN(num)) throw new Error(`ID de rifa inválido: ${id}`);
            return num;
        });

        // Check for duplicate Yape operation code
        const duplicateCheck = await db.query(
            `SELECT id FROM transactions 
             WHERE yape_operation_code = $1 
             AND status IN ('completed', 'pending_verification')`,
            [yape_operation_code]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'Este código de operación ya fue usado. Verifica tu código.'
            });
        }

        const totalAmount = raffleIdsInt.length * 5.00;

        const result = await db.transaction(async (client) => {
            // Validate all raffles
            for (const raffleId of raffleIdsInt) {
                const raffle = await client.query(
                    'SELECT id, status, reserved_by, reserved_at FROM raffles WHERE id = $1 FOR UPDATE',
                    [raffleId]
                );

                if (raffle.rows.length === 0) {
                    throw new Error(`Rifa ${raffleId} no encontrada`);
                }

                const current = raffle.rows[0];

                if (current.status === 'sold') {
                    throw new Error(`Rifa ${raffleId} ya fue vendida`);
                }

                // Check reservation blocking
                if (current.status === 'reserved' && current.reserved_by) {
                    const reservedAt = new Date(current.reserved_at);
                    const now = new Date();
                    const secondsSinceReserved = (now - reservedAt) / 1000;

                    const isSameUser = isValidUUID(user_id) && isValidUUID(current.reserved_by) && current.reserved_by === user_id;

                    if (!isSameUser && secondsSinceReserved < 60) {
                        throw new Error(`Rifa ${raffleId} acaba de ser reservada. Intenta en 1 minuto.`);
                    }
                }
            }

            // Create single transaction
            const transaction = await client.query(
                `INSERT INTO transactions (
                    user_id, amount, payment_method, status,
                    confirmation_code, yape_operation_code, yape_sender_name,
                    verified_by_webhook, created_at
                 )
                 VALUES ($1, $2, 'yape', 'pending_verification', $3, $4, $5, false, NOW())
                 RETURNING id, confirmation_code`,
                [
                    isValidUUID(user_id) ? user_id : null,
                    totalAmount,
                    generateConfirmationCode(),
                    yape_operation_code,
                    yape_sender_name
                ]
            );

            const transactionId = transaction.rows[0].id;

            // Link all raffles to this transaction via junction table
            for (const raffleId of raffleIdsInt) {
                await client.query(
                    'INSERT INTO transaction_raffles (transaction_id, raffle_id) VALUES ($1, $2)',
                    [transactionId, raffleId]
                );

                // Mark raffle as reserved
                await client.query(
                    `UPDATE raffles 
                     SET status = 'reserved', 
                         reserved_by = $1,
                         reserved_at = NOW()
                     WHERE id = $2`,
                    [user_id, raffleId]
                );
            }

            return {
                transaction: transaction.rows[0],
                raffle_ids: raffleIdsInt,
                total_amount: totalAmount
            };
        });

        // Send WhatsApp notification to admin
        if (whatsappService) {
            try {
                const raffleNumbers = raffleIdsInt.join(', ');

                let userData = {
                    nombre: yape_sender_name || 'Guest',
                    dni: 'No proporcionado',
                    celular: null
                };

                if (isValidUUID(user_id)) {
                    const userResult = await db.query(
                        'SELECT nombre, apellido, dni, celular FROM users WHERE id = $1',
                        [user_id]
                    );
                    if (userResult.rows.length > 0) {
                        const user = userResult.rows[0];
                        userData = {
                            nombre: `${user.nombre} ${user.apellido}`,
                            dni: user.dni,
                            celular: user.celular
                        };
                    }
                }

                await whatsappService.notifyAdminNewPayment({
                    customerName: userData.nombre,
                    customerDNI: userData.dni,
                    customerPhone: userData.celular,
                    raffleId: raffleNumbers,
                    amount: totalAmount,
                    yapeCode: yape_operation_code,
                    yapeSender: yape_sender_name
                });

                console.log('✅ Admin notified via WhatsApp');
            } catch (whatsappError) {
                console.error('⚠️ WhatsApp notification failed:', whatsappError.message);
            }
        }

        res.json({
            success: true,
            message: `${raffleIdsInt.length} compra(s) registrada(s). Serán verificadas por un administrador.`,
            transaction_id: result.transaction.id,
            confirmation_code: result.transaction.confirmation_code,
            raffle_count: raffleIdsInt.length,
            raffle_ids: raffleIdsInt,
            total_amount: result.total_amount,
            status: 'pending_verification'
        });

    } catch (error) {
        console.error('❌ Batch purchase error:', error);
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
            console.log('ðŸ“ Generated temporary user_id:', user_id);
        }

        // Validate Yape data (required for manual verification)
        if (!yape_operation_code || !yape_sender_name) {
            return res.status(400).json({
                error: 'CÃ³digo de operaciÃ³n Yape y nombre del yapero son requeridos'
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
                error: 'Este cÃ³digo de operaciÃ³n ya fue usado. Verifica tu cÃ³digo.'
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

            // Permitir purchase si NO estÃ¡ sold
            // Esto permite compra directa de available y override de reserved

            // Add this NEW endpoint to backend/routes/raffles.js
            // Insert BEFORE the existing POST /:id/purchase endpoint (around line 220)

            /**
             * POST /api/raffles/purchase-batch
             * SIMPLE: Purchase multiple raffles in ONE transaction
             */
            router.post('/purchase-batch', async (req, res, next) => {
                try {
                    const { raffle_ids, user_id, yape_operation_code, yape_sender_name } = req.body;

                    console.log('ðŸ”µ Batch purchase:', { raffle_ids, user_id, yape_operation_code, yape_sender_name });

                    // Validate input
                    if (!Array.isArray(raffle_ids) || raffle_ids.length === 0) {
                        return res.status(400).json({ error: 'Se requiere al menos una rifa' });
                    }
                    if (!yape_operation_code || !yape_sender_name) {
                        return res.status(400).json({ error: 'CÃ³digo Yape y nombre requeridos' });
                    }

                    // Get all raffles in one query
                    const raffles = await db.query(
                        'SELECT id, status, reserved_by FROM raffles WHERE id = ANY($1::int[])',
                        [raffle_ids]
                    );

                    // Validate all raffles are available or reserved by this user
                    for (const raffle of raffles.rows) {
                        if (raffle.status === 'sold') {
                            return res.status(400).json({ error: `Rifa ${raffle.id} ya fue vendida` });
                        }
                        if (raffle.status === 'reserved' && raffle.reserved_by !== user_id) {
                            return res.status(400).json({ error: `Rifa ${raffle.id} reservada por otro usuario` });
                        }
                    }

                    // Create ONE transaction for ALL raffles
                    const totalAmount = raffle_ids.length * 5.00;
                    const transactionId = uuidv4();

                    // Insert transaction (using first raffle_id as reference)
                    await db.query(
                        `INSERT INTO transactions (id, user_id, raffle_id, total_amount, status, yape_operation_code, yape_sender_name, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                        [transactionId, user_id, raffle_ids[0], totalAmount, 'pending_verification', yape_operation_code, yape_sender_name]
                    );

                    // Mark ALL raffles as reserved
                    await db.query(
                        `UPDATE raffles 
             SET status = 'reserved', reserved_by = $1, reserved_at = NOW()
             WHERE id = ANY($2::int[])`,
                        [user_id, raffle_ids]
                    );

                    console.log(`âœ… Batch purchase OK: ${raffle_ids.length} rifas, transaction ${transactionId}`);

                    res.json({
                        success: true,
                        transaction_id: transactionId,
                        raffle_count: raffle_ids.length,
                        total_amount: totalAmount,
                        raffle_ids: raffle_ids
                    });

                } catch (error) {
                    console.error('âŒ Batch purchase error:', error);
                    next(error);
                }
            });
            if (current.status === 'sold') {
                throw new Error('Esta rifa ya fue vendida');
            }

            // Si estÃ¡ reserved por OTRO usuario (no el mismo), verificar tiempo
            if (current.status === 'reserved' && current.reserved_by) {
                const reservedAt = new Date(current.reserved_at);
                const now = new Date();
                const secondsSinceReserved = (now - reservedAt) / 1000;

                // Si es el mismo usuario con UUID vÃ¡lido, permitir compra inmediata
                const isSameUser = isValidUUID(user_id) && isValidUUID(current.reserved_by) && current.reserved_by === user_id;

                // Para diferentes usuarios o guests, verificar que haya pasado tiempo suficiente
                if (!isSameUser && secondsSinceReserved < 60) {
                    throw new Error('Esta rifa acaba de ser reservada. Intenta en 1 minuto.');
                }
                // Si es el mismo usuario o pasÃ³ > 60 segundos, permitir override
            }

            // Si estÃ¡ reserved por el MISMO user, permitir (es su propia reserva del carrito)

            // NO marcar como sold todavÃ­a - dejar en reserved
            // La rifa se marcarÃ¡ como sold cuando admin apruebe la verificaciÃ³n

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
                    const adminMessage = `ðŸ”” *Nueva compra pendiente*\n\n` +
                        `ðŸ‘¤ ${user.nombre} ${user.apellido}\n` +
                        `ðŸ“± ${user.celular}\n` +
                        `ðŸŽŸï¸ Rifa #${raffleValidation.id}\n` +
                        `ðŸ’° S/ 5.00\n\n` +
                        `*Datos Yape:*\n` +
                        `ðŸ“ CÃ³digo: ${yape_operation_code}\n` +
                        `ðŸ‘¤ Yapero: ${yape_sender_name}\n\n` +
                        `Verifica en admin panel`;

                    await whatsappService.sendMessage('+51906450533', adminMessage);
                    console.log('âœ… Admin WhatsApp sent');
                }
            } catch (whatsappError) {
                console.error('âŒ Admin WhatsApp failed:', whatsappError.message);
            }
        } else if (!isValidUUID(user_id)) {
            console.log('âš ï¸ Skipping WhatsApp - guest user (no valid UUID)');
        }

        // Send success response
        res.json({
            success: true,
            message: 'Compra registrada. SerÃ¡ verificada por un administrador.',
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
                    console.log('âœ… WhatsApp customer TEMPLATE sent to:', result.user.celular);
                } catch (templateError) {
                    console.log('âš ï¸  Template no disponible, usando texto libre');
                    await whatsappService.sendPurchaseNotification(
                        result.user,
                        [result.raffle.id],
                        5.00
                    );
                    console.log('âœ… WhatsApp customer TEXT sent to:', result.user.celular);
                }
            } catch (customerError) {
                console.error('âŒ Failed to send customer notification:', customerError.message);
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
                    console.log('âœ… WhatsApp admin TEMPLATE sent');
                } catch (templateError) {
                    await whatsappService.sendAdminPurchaseNotification(
                        result.user,
                        [result.raffle.id],
                        5.00
                    );
                    console.log('âœ… WhatsApp admin TEXT sent');
                }
            } catch (adminError) {
                console.error('âŒ Failed to send admin notification:', adminError.message);
                // Don't fail the purchase if admin notification fails
            }
        }

        res.json({
            message: 'Compra iniciada. Escanea el cÃ³digo QR de Yape para completar el pago.',
            raffle: result.raffle,
            payment: {
                method: 'yape',
                amount: 5.00,
                qr_code: result.transaction.qr_code_url,
                instructions: `Escanea el cÃ³digo QR con tu app de Yape y paga S/ 5.00. En el concepto debe aparecer: Rifa No. ${result.raffle.id}`
            },
            transaction_id: result.transaction.id
        });
    } catch (error) {
        if (error.message.includes('no estÃ¡ reservada') ||
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
                error: 'No se encontrÃ³ una reserva activa para este usuario'
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

/**
 * POST /api/cart/purchase
 * Purchase multiple raffles in a single transaction
 */
router.post('/cart/purchase', async (req, res, next) => {
    try {
        const { raffle_ids, user_id, yape_operation_code, yape_sender_name } = req.body;

        console.log('ðŸ“¥ Cart purchase request:', { raffle_ids, user_id, yape_operation_code, yape_sender_name });

        // Validate input
        if (!Array.isArray(raffle_ids) || raffle_ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos una rifa' });
        }

        if (!yape_operation_code || !yape_sender_name) {
            return res.status(400).json({ error: 'CÃ³digo Yape y nombre del yapero son requeridos' });
        }

        // Convert raffle IDs to integers (in case they come as strings)
        const raffleIdsInt = raffle_ids.map(id => {
            const num = parseInt(id);
            if (isNaN(num)) {
                throw new Error(`ID de rifa invÃ¡lido: ${id}`);
            }
            return num;
        });

        console.log('âœ… Raffle IDs converted to integers:', raffleIdsInt);

        const totalAmount = raffleIdsInt.length * 5.00;

        const result = await db.transaction(async (client) => {
            // Validate all raffles are available/reserved
            for (const raffleId of raffleIdsInt) {
                const raffle = await client.query(
                    'SELECT id, status, reserved_by, reserved_at FROM raffles WHERE id = $1',
                    [raffleId]
                );

                if (raffle.rows.length === 0) {
                    throw new Error(`Rifa ${raffleId} no encontrada`);
                }

                const current = raffle.rows[0];

                if (current.status === 'sold') {
                    throw new Error(`Rifa ${raffleId} ya fue vendida`);
                }

                // Check reservation blocking (same logic as single purchase)
                if (current.status === 'reserved' && current.reserved_by) {
                    const reservedAt = new Date(current.reserved_at);
                    const now = new Date();
                    const secondsSinceReserved = (now - reservedAt) / 1000;

                    const isSameUser = isValidUUID(user_id) && isValidUUID(current.reserved_by) && current.reserved_by === user_id;

                    if (!isSameUser && secondsSinceReserved < 60) {
                        throw new Error(`Rifa ${raffleId} acaba de ser reservada. Intenta en 1 minuto.`);
                    }
                }
            }

            // Create single transaction with total amount
            const transaction = await client.query(
                `INSERT INTO transactions (
                    user_id, amount, payment_method, status,
                    confirmation_code, yape_operation_code, yape_sender_name,
                    verified_by_webhook, created_at
                 )
                 VALUES ($1, $2, 'yape', 'pending_verification', $3, $4, $5, false, NOW())
                 RETURNING id, confirmation_code`,
                [
                    isValidUUID(user_id) ? user_id : null,
                    totalAmount,
                    generateConfirmationCode(),
                    yape_operation_code,
                    yape_sender_name
                ]
            );

            const transactionId = transaction.rows[0].id;

            // Link all raffles to this transaction
            for (const raffleId of raffleIdsInt) {
                await client.query(
                    'INSERT INTO transaction_raffles (transaction_id, raffle_id) VALUES ($1, $2)',
                    [transactionId, raffleId]
                );

                // Mark raffle as reserved
                await client.query(
                    `UPDATE raffles 
                     SET status = 'reserved', 
                         reserved_by = $1,
                         reserved_at = NOW()
                     WHERE id = $2`,
                    [user_id, raffleId]
                );
            }

            return {
                transaction: transaction.rows[0],
                raffle_ids: raffleIdsInt,
                total_amount: totalAmount
            };
        });

        // Send WhatsApp notification to admin
        try {
            const whatsappService = require('../services/whatsappService');
            const raffleNumbers = raffleIdsInt.join(', ');

            let userData = {
                nombre: yape_sender_name || 'Guest',
                dni: 'No proporcionado',
                celular: null
            };

            if (isValidUUID(user_id)) {
                const userResult = await db.query(
                    'SELECT nombre, apellido, dni, celular FROM users WHERE id = $1',
                    [user_id]
                );
                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    userData = {
                        nombre: `${user.nombre} ${user.apellido}`,
                        dni: user.dni,
                        celular: user.celular
                    };
                }
            }

            await whatsappService.notifyAdminNewPayment({
                customerName: userData.nombre,
                customerDNI: userData.dni,
                customerPhone: userData.celular,
                raffleId: raffleNumbers,
                amount: totalAmount,
                yapeCode: yape_operation_code,
                yapeSender: yape_sender_name
            });

            console.log('âœ… Admin notified via WhatsApp');
        } catch (whatsappError) {
            console.error('âš ï¸ WhatsApp notification failed:', whatsappError.message);
            // Don't fail the purchase if WhatsApp fails
        }

        res.json({
            success: true,
            message: `${raffle_ids.length} compra(s) registrada(s). SerÃ¡n verificadas por un administrador.`,
            transaction_id: result.transaction.id,
            confirmation_code: result.transaction.confirmation_code,
            raffle_count: raffle_ids.length,
            raffle_ids: raffle_ids,
            total_amount: result.total_amount,
            status: 'pending_verification'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
