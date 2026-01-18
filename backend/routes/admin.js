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
                (SELECT SUM(amount) FROM transactions WHERE status = 'completed') as total_recaudado
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
        const users = await db.query(`
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
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json(users.rows);
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
 * GET /api/admin/pending-verifications
 * Lista de pagos Yape pendientes de verificación
 */
router.get('/pending-verifications', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const pending = await db.query(`
            SELECT 
                t.id,
                t.amount,
                t.yape_operation_code,
                t.yape_sender_name,
                t.created_at,
                t.confirmation_code,
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
            WHERE t.status = 'pending_verification'
            GROUP BY t.id, u.nombre, u.apellido, u.dni, u.celular
            ORDER BY t.created_at DESC
        `);

        res.json(pending.rows);
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

        await db.transaction(async (client) => {
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

            if (result.user_id) {
                // Get user info
                const userResult = await db.query(
                    'SELECT nombre, apellido, dni, celular FROM users WHERE id = $1',
                    [result.user_id]
                );

                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    const raffleNumbers = result.raffle_ids.join(', ');
                    const totalAmount = result.raffle_ids.length * 5.00;

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
try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.transaction(async (client) => {
        // Get transaction info
        const txResult = await client.query(
            'SELECT raffle_id, status FROM transactions WHERE id = $1',
            [id]
        );

        if (txResult.rows.length === 0) {
            throw new Error('Transacción no encontrada');
        }

        const transaction = txResult.rows[0];

        if (transaction.status !== 'pending_verification') {
            throw new Error('Esta transacción ya fue procesada');
        }

        // Get all raffles for this transaction
        const rafflesResult = await client.query(
            'SELECT raffle_id FROM transaction_raffles WHERE transaction_id = $1',
            [id]
        );

        const raffleIds = rafflesResult.rows.length > 0
            ? rafflesResult.rows.map(r => r.raffle_id)
            : (transaction.raffle_id ? [transaction.raffle_id] : []);

        // Update transaction to cancelled
        await client.query(
            `UPDATE transactions 
                 SET status = 'cancelled',
                     rejection_reason = $1,
                     verified_by = $2
                 WHERE id = $3`,
            [reason || 'Rechazado por administrador', req.user.id, id]
        );

        // Free ALL raffles
        for (const raffleId of raffleIds) {
            await client.query(
                `UPDATE raffles 
                     SET status = 'available',
                         reserved_by = NULL,
                         reserved_at = NULL,
                         reserved_until = NULL
                     WHERE id = $1`,
                [raffleId]
            );
        }
    });

    res.json({ message: 'Pago rechazado y rifas liberadas' });
} catch (error) {
    next(error);
}
});

module.exports = router;
