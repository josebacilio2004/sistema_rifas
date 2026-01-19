const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/admin/login
 * Autenticación de administradores
 */
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log('🔐 Admin login attempt:', { username, hasPassword: !!password });

        if (!username || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        console.log('📝 Checking JWT_SECRET exists:', !!process.env.JWT_SECRET);

        // Buscar admin en base de datos
        const result = await db.query(
            'SELECT * FROM admins WHERE username = $1',
            [username.toLowerCase()]
        );

        console.log('🔍 Query result:', { found: result.rows.length > 0, username: username.toLowerCase() });

        if (result.rows.length === 0) {
            console.log('❌ Admin not found in database');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const admin = result.rows[0];
        console.log('✅ Admin found:', { id: admin.id, username: admin.username });

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        console.log('🔑 Password validation:', validPassword);

        if (!validPassword) {
            console.log('❌ Invalid password');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último login
        await db.query(
            'UPDATE admins SET last_login = NOW() WHERE id = $1',
            [admin.id]
        );

        // Generar token JWT
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful, token generated');

        res.json({
            token,
            admin: {
                username: admin.username,
                nombre: admin.nombre_completo
            }
        });
    } catch (error) {
        console.error('💥 Login error:', error.message);
        next(error);
    }
});

/**
 * GET /api/admin/dashboard
 * Estadísticas generales del sistema
 */
router.get('/dashboard', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_usuarios,
                (SELECT COUNT(*) FROM raffles WHERE status = 'sold') as rifas_vendidas,
                (SELECT COUNT(*) FROM raffles WHERE status = 'available') as rifas_disponibles,
                (SELECT COUNT(*) FROM raffles WHERE status = 'reserved') as rifas_reservadas,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'approved') as total_recaudado
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/users
 * Lista de todos los usuarios con sus compras
 */
router.get('/users', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

        let query = `
            SELECT 
                u.id, 
                u.nombre, 
                u.apellido, 
                u.dni, 
                u.celular, 
                u.created_at,
                COUNT(r.id) as rifas_compradas,
                COALESCE(
                    ARRAY_AGG(r.id ORDER BY r.purchased_at DESC) FILTER (WHERE r.id IS NOT NULL),
                    ARRAY[]::integer[]
                ) as numeros_rifas,
                COALESCE(SUM(CASE WHEN r.status = 'sold' THEN 5.00 ELSE 0 END), 0) as total_gastado
            FROM users u
            LEFT JOIN raffles r ON r.purchased_by = u.id AND r.status = 'sold'
        `;

        const params = [];

        // Add search filter
        if (search && search.trim()) {
            query += ` WHERE (
                LOWER(u.nombre) LIKE LOWER($1) OR 
                LOWER(u.apellido) LIKE LOWER($1) OR 
                u.dni LIKE $1 OR 
                u.celular LIKE $1
            )`;
            params.push(`%${search.trim()}%`);
        }

        query += ` GROUP BY u.id`;

        // Add sorting
        const validSortColumns = ['created_at', 'nombre', 'rifas_compradas', 'total_gastado'];
        const validSortOrders = ['ASC', 'DESC'];

        if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
            if (sortBy === 'rifas_compradas' || sortBy === 'total_gastado') {
                query += ` ORDER BY ${sortBy} ${sortOrder}`;
            } else {
                query += ` ORDER BY u.${sortBy} ${sortOrder}`;
            }
        } else {
            query += ` ORDER BY u.created_at DESC`;
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/sales
 * Historial de ventas detallado
 */
router.get('/sales', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const sales = await db.query(`
            SELECT 
                r.id as raffle_id,
                r.purchased_at,
                u.nombre,
                u.apellido,
                u.dni,
                u.celular,
                t.amount,
                t.payment_method,
                t.status as payment_status
            FROM raffles r
            JOIN users u ON r.purchased_by = u.id
            LEFT JOIN transactions t ON t.raffle_id = r.id
            WHERE r.status = 'sold'
            ORDER BY r.purchased_at DESC
        `);

        res.json(sales.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/user/:id
 * Detalle de un usuario específico
 */
router.get('/user/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const raffles = await db.query(
            `SELECT id, purchased_at, status 
             FROM raffles 
             WHERE purchased_by = $1 
             ORDER BY purchased_at DESC`,
            [id]
        );

        res.json({
            user: user.rows[0],
            raffles: raffles.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/pending-verifications - Get pending payment verifications with filters
 */
router.get('/pending-verifications', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { search, status = 'pending_verification' } = req.query;

        let query = `
            SELECT 
                t.id,
                t.amount,
                t.yape_operation_code,
                t.yape_sender_name,
                t.created_at,
                t.confirmation_code,
                t.status,
                u.nombre,
                u.apellido,
                u.dni,
                u.celular,
                COALESCE(
                    ARRAY_AGG(tr.raffle_id ORDER BY tr.raffle_id) FILTER (WHERE tr.raffle_id IS NOT NULL),
                    ARRAY[t.raffle_id]
                ) as raffle_ids
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN transaction_raffles tr ON t.id = tr.transaction_id
        `;

        const params = [];
        const conditions = [];

        // Status filter
        if (status && status !== 'all') {
            conditions.push(`t.status = $${params.length + 1}`);
            params.push(status);
        }

        // Search filter
        if (search && search.trim()) {
            conditions.push(`(
                LOWER(u.nombre) LIKE LOWER($${params.length + 1}) OR 
                LOWER(u.apellido) LIKE LOWER($${params.length + 1}) OR 
                t.yape_operation_code LIKE $${params.length + 1} OR
                t.confirmation_code LIKE $${params.length + 1}
            )`);
            params.push(`%${search.trim()}%`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` GROUP BY t.id, u.nombre, u.apellido, u.dni, u.celular
                   ORDER BY t.created_at DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/approve-payment/:id
 * Aprobar un pago pendiente
 */
router.post('/approve-payment/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const transactionResult = await db.transaction(async (client) => {
            // Get transaction info
            const txResult = await client.query(
                'SELECT user_id, raffle_id, status FROM transactions WHERE id = $1',
                [id]
            );

            if (txResult.rows.length === 0) {
                throw new Error('Transacción no encontrada');
            }

            const transaction = txResult.rows[0];

            if (transaction.status !== 'pending_verification') {
                throw new Error('Esta transacción ya fue procesada');
            }

            // Get all raffles for this transaction (from junction table)
            const rafflesResult = await client.query(
                'SELECT raffle_id FROM transaction_raffles WHERE transaction_id = $1',
                [id]
            );

            // If no junction entries, use single raffle_id from transaction (backwards compatibility)
            const raffleIds = rafflesResult.rows.length > 0
                ? rafflesResult.rows.map(r => r.raffle_id)
                : (transaction.raffle_id ? [transaction.raffle_id] : []);

            if (raffleIds.length === 0) {
                throw new Error('No se encontraron rifas asociadas a esta transacción');
            }

            // Update transaction to completed
            await client.query(
                `UPDATE transactions 
                 SET status = 'completed',
                     completed_at = NOW(),
                     verified_by = $1
                 WHERE id = $2`,
                [req.user.id, id]
            );

            // Mark ALL raffles as sold
            for (const raffleId of raffleIds) {
                await client.query(
                    `UPDATE raffles 
                     SET status = 'sold',
                         purchased_by = $1,
                         purchased_at = NOW(),
                         reserved_by = NULL,
                         reserved_at = NULL,
                         reserved_until = NULL
                     WHERE id = $2`,
                    [transaction.user_id, raffleId]
                );
            }

            return { user_id: transaction.user_id, raffle_ids: raffleIds };
        });

        // Send WhatsApp notification to customer
        try {
            const whatsappService = require('../services/whatsappService');

            if (transactionResult.user_id) {
                // Get user info
                const userResult = await db.query(
                    'SELECT nombre, apellido, dni, celular FROM users WHERE id = $1',
                    [transactionResult.user_id]
                );

                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    const raffleNumbers = transactionResult.raffle_ids.join(', ');
                    const totalAmount = transactionResult.raffle_ids.length * 5.00;

                    await whatsappService.notifyCustomerPurchaseApproved({
                        customerPhone: user.celular,
                        customerName: user.nombre,
                        raffleId: raffleNumbers,
                        amount: totalAmount,
                        customerDNI: user.dni
                    });

                    console.log('✅ Customer notified via WhatsApp');
                }
            }
        } catch (whatsappError) {
            console.error('⚠️ Customer WhatsApp failed:', whatsappError.message);
        }

        res.json({ message: 'Pago aprobado exitosamente' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/reject-payment/:id
 * Rechazar un pago pendiente
 */
router.post('/reject-payment/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.transaction(async (client) => {
            // Get transaction
            const transaction = await client.query(
                'SELECT * FROM transactions WHERE id = $1',
                [id]
            );

            if (transaction.rows.length === 0) {
                throw new Error('Transacción no encontrada');
            }

            const trans = transaction.rows[0];

            // Update transaction status to rejected
            await client.query(
                `UPDATE transactions SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
                [id]
            );

            // Get raffle IDs (support both old single raffle and new multiple raffles)
            let raffleIds = [trans.raffle_id];

            // Try to get from junction table if exists
            const junctionRaffles = await client.query(
                'SELECT raffle_id FROM transaction_raffles WHERE transaction_id = $1',
                [id]
            );

            if (junctionRaffles.rows.length > 0) {
                raffleIds = junctionRaffles.rows.map(r => r.raffle_id);
            }

            // Free all raffles
            await client.query(
                `UPDATE raffles SET status = 'available', reserved_by = NULL, reserved_at = NULL 
                 WHERE id = ANY($1::int[])`,
                [raffleIds]
            );

            return { success: true, raffles_freed: raffleIds.length };
        });

        res.json(result);

    } catch (error) {
        console.error('Error rejecting payment:', error);
        next(error);
    }
});

/**
 * POST /api/admin/reset-raffles
 * Reinicia todas las rifas para un nuevo sorteo
 */
router.post('/reset-raffles', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { totalRaffles = 100 } = req.body;

        if (totalRaffles < 10 || totalRaffles > 1000) {
            return res.status(400).json({ error: 'La cantidad debe estar entre 10 y 1000' });
        }

        const result = await db.transaction(async (client) => {
            await client.query(`UPDATE raffle_rounds SET status = 'completed', ended_at = NOW() WHERE status = 'active'`);

            const roundResult = await client.query(`SELECT COALESCE(MAX(round_number), 0) + 1 as next_round FROM raffle_rounds`);
            const nextRound = roundResult.rows[0].next_round;

            const newRound = await client.query(
                `INSERT INTO raffle_rounds (round_number, total_raffles, status) VALUES ($1, $2, 'active') RETURNING id`,
                [nextRound, totalRaffles]
            );

            await client.query(`UPDATE raffles SET status = 'available', purchased_by = NULL, purchased_at = NULL, reserved_by = NULL, reserved_at = NULL, reserved_until = NULL`);

            const currentCount = await client.query('SELECT COUNT(*) as count FROM raffles');
            const current = parseInt(currentCount.rows[0].count);

            if (totalRaffles > current) {
                for (let i = current + 1; i <= totalRaffles; i++) {
                    await client.query('INSERT INTO raffles (id, status) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [i, 'available']);
                }
            } else if (totalRaffles < current) {
                await client.query('DELETE FROM raffles WHERE id > $1', [totalRaffles]);
            }

            return { round_number: nextRound, total_raffles: totalRaffles };
        });

        console.log('✅ Rifas reiniciadas:', result);
        res.json({ success: true, message: `Sistema reiniciado para Sorteo #${result.round_number}`, ...result });
    } catch (error) {
        console.error('❌ Error resetting raffles:', error);
        next(error);
    }
});

/**
 * POST /api/admin/draw-winner
 * Realiza el sorteo y selecciona ganador
 */
router.post('/draw-winner', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const result = await db.transaction(async (client) => {
            const activeRound = await client.query(`SELECT id, round_number FROM raffle_rounds WHERE status = 'active' LIMIT 1`);
            if (activeRound.rows.length === 0) throw new Error('No hay ronda activa');

            const round = activeRound.rows[0];
            const soldRaffles = await client.query(`SELECT id, purchased_by FROM raffles WHERE status = 'sold' ORDER BY id`);
            if (soldRaffles.rows.length === 0) throw new Error('No hay rifas vendidas');

            const randomIndex = Math.floor(Math.random() * soldRaffles.rows.length);
            const winnerRaffle = soldRaffles.rows[randomIndex];

            const winnerInfo = await client.query(`SELECT id, nombre, apellido, dni, celular FROM users WHERE id = $1`, [winnerRaffle.purchased_by]);
            const winner = winnerInfo.rows[0];

            await client.query(`UPDATE raffle_rounds SET winner_raffle_id = $1, winner_user_id = $2, status = 'completed', ended_at = NOW() WHERE id = $3`,
                [winnerRaffle.id, winner.id, round.id]);

            return {
                round_number: round.round_number,
                raffle_id: winnerRaffle.id,
                winner: { id: winner.id, nombre: winner.nombre, apellido: winner.apellido, dni: winner.dni, celular: winner.celular },
                total_participants: soldRaffles.rows.length
            };
        });

        try {
            const whatsappService = require('../services/whatsappService');
            if (result.winner.celular) {
                await whatsappService.notifyWinner({
                    customerPhone: result.winner.celular,
                    customerName: result.winner.nombre,
                    raffleId: result.raffle_id
                });
            }
        } catch (whatsappError) {
            console.error('⚠️ WhatsApp failed:', whatsappError.message);
        }

        console.log('🎉 Ganador:', result);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('❌ Error drawing winner:', error);
        next(error);
    }
});

/**
 * GET /api/admin/raffle-history
 * Historial de sorteos
 */
router.get('/raffle-history', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const history = await db.query(`
            SELECT rr.*, u.nombre as winner_nombre, u.apellido as winner_apellido, u.dni as winner_dni
            FROM raffle_rounds rr
            LEFT JOIN users u ON rr.winner_user_id = u.id
            ORDER BY rr.round_number DESC
            LIMIT 50
        `);
        res.json(history.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/raffle-status
 * Get current raffle sales status
 */
router.get('/raffle-status', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const result = await db.query('SELECT sales_enabled, updated_at FROM raffle_system_config LIMIT 1');

        if (result.rows.length === 0) {
            // Initialize if not exists
            await db.query('INSERT INTO raffle_system_config (sales_enabled) VALUES (true)');
            return res.json({ sales_enabled: true });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/toggle-raffle-sales
 * Enable or disable raffle sales
 */
router.post('/toggle-raffle-sales', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { enabled } = req.body;

        console.log('Toggle raffle sales:', { enabled });

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled must be a boolean' });
        }

        const result = await db.query(
            'UPDATE raffle_system_config SET sales_enabled = $1 WHERE id = 1 RETURNING *',
            [enabled]
        );

        console.log('Update result:', result.rows);

        res.json({
            success: true,
            sales_enabled: enabled,
            message: enabled ? 'Ventas de rifas habilitadas' : 'Ventas de rifas deshabilitadas'
        });
    } catch (error) {
        console.error('Toggle error:', error);
        res.status(500).json({ error: 'Error al cambiar estado', details: error.message });
    }
});

module.exports = router;
