/**
 * Admin Endpoints - Nuevas Funcionalidades
 * - Reiniciar rifas para nuevo sorteo
 * - Realizar sorteo y seleccionar ganador
 * - Gestionar imágenes de premios por URL
 */

const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

/**
 * POST /api/admin/reset-raffles
 * Reinicia todas las rifas para un nuevo sorteo
 * Mantiene historial de sorteos anteriores
 */
router.post('/reset-raffles', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { totalRaffles = 100 } = req.body;

        // Validar cantidad
        if (totalRaffles < 10 || totalRaffles > 1000) {
            return res.status(400).json({
                error: 'La cantidad de rifas debe estar entre 10 y 1000'
            });
        }

        const result = await db.transaction(async (client) => {
            // 1. Cerrar ronda actual
            await client.query(`
                UPDATE raffle_rounds 
                SET status = 'completed', ended_at = NOW()
                WHERE status = 'active'
            `);

            // 2. Obtener número de siguiente ronda
            const roundResult = await client.query(`
                SELECT COALESCE(MAX(round_number), 0) + 1 as next_round
                FROM raffle_rounds
            `);
            const nextRound = roundResult.rows[0].next_round;

            // 3. Crear nueva ronda
            const newRound = await client.query(`
                INSERT INTO raffle_rounds (round_number, total_raffles, status)
                VALUES ($1, $2, 'active')
                RETURNING id, round_number
            `, [nextRound, totalRaffles]);

            // 4. Resetear rifas existentes
            await client.query(`
                UPDATE raffles 
                SET status = 'available',
                    purchased_by = NULL,
                    purchased_at = NULL,
                    reserved_by = NULL,
                    reserved_at = NULL,
                    reserved_until = NULL
            `);

            // 5. Ajustar cantidad de rifas
            const currentCount = await client.query('SELECT COUNT(*) as count FROM raffles');
            const current = parseInt(currentCount.rows[0].count);

            if (totalRaffles > current) {
                // Agregar rifas faltantes
                for (let i = current + 1; i <= totalRaffles; i++) {
                    await client.query(
                        'INSERT INTO raffles (id, status) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
                        [i, 'available']
                    );
                }
            } else if (totalRaffles < current) {
                // Remover rifas sobrantes
                await client.query('DELETE FROM raffles WHERE id > $1', [totalRaffles]);
            }

            // 6. Actualizar configuración
            await client.query(`
                UPDATE system_config 
                SET value = $1, updated_by = $2
                WHERE key = 'total_raffles'
            `, [totalRaffles.toString(), req.user.id]);

            await client.query(`
                UPDATE system_config 
                SET value = $1, updated_by = $2
                WHERE key = 'current_round'
            `, [nextRound.toString(), req.user.id]);

            return {
                round_number: nextRound,
                total_raffles: totalRaffles,
                round_id: newRound.rows[0].id
            };
        });

        console.log('✅ Rifas reiniciadas:', result);
        res.json({
            success: true,
            message: `Sistema reiniciado para Sorteo #${result.round_number}`,
            ...result
        });
    } catch (error) {
        console.error('❌ Error resetting raffles:', error);
        next(error);
    }
});

/**
 * POST /api/admin/draw-winner
 * Realiza el sorteo y selecciona un ganador aleatorio
 */
router.post('/draw-winner', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const result = await db.transaction(async (client) => {
            // 1. Verificar que hay ronda activa
            const activeRound = await client.query(`
                SELECT id, round_number 
                FROM raffle_rounds 
                WHERE status = 'active'
                LIMIT 1
            `);

            if (activeRound.rows.length === 0) {
                throw new Error('No hay una ronda activa para sortear');
            }

            const round = activeRound.rows[0];

            // 2. Obtener todas las rifas vendidas
            const soldRaffles = await client.query(`
                SELECT id, purchased_by 
                FROM raffles 
                WHERE status = 'sold'
                ORDER BY id
            `);

            if (soldRaffles.rows.length === 0) {
                throw new Error('No hay rifas vendidas para sortear');
            }

            // 3. Seleccionar ganador aleatorio
            const randomIndex = Math.floor(Math.random() * soldRaffles.rows.length);
            const winnerRaffle = soldRaffles.rows[randomIndex];

            // 4. Obtener información del ganador
            const winnerInfo = await client.query(`
                SELECT id, nombre, apellido, dni, celular 
                FROM users 
                WHERE id = $1
            `, [winnerRaffle.purchased_by]);

            if (winnerInfo.rows.length === 0) {
                throw new Error('No se encontró información del ganador');
            }

            const winner = winnerInfo.rows[0];

            // 5. Registrar ganador en la ronda
            await client.query(`
                UPDATE raffle_rounds 
                SET winner_raffle_id = $1,
                    winner_user_id = $2,
                    status = 'completed',
                    ended_at = NOW()
                WHERE id = $3
            `, [winnerRaffle.id, winner.id, round.id]);

            return {
                round_number: round.round_number,
                raffle_id: winnerRaffle.id,
                winner: {
                    id: winner.id,
                    nombre: winner.nombre,
                    apellido: winner.apellido,
                    dni: winner.dni,
                    celular: winner.celular
                },
                total_participants: soldRaffles.rows.length
            };
        });

        // Enviar notificación WhatsApp al ganador
        try {
            if (whatsappService && result.winner.celular) {
                await whatsappService.notifyWinner({
                    customerPhone: result.winner.celular,
                    customerName: result.winner.nombre,
                    raffleId: result.raffle_id,
                    roundNumber: result.round_number
                });
                console.log('✅ Winner notified via WhatsApp');
            }
        } catch (whatsappError) {
            console.error('⚠️ WhatsApp notification failed:', whatsappError.message);
        }

        console.log('🎉 Winner drawn:', result);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('❌ Error drawing winner:', error);
        next(error);
    }
});

/**
 * GET /api/admin/raffle-history
 * Obtiene el historial de sorteos anteriores
 */
router.get('/raffle-history', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const history = await db.query(`
            SELECT 
                rr.id,
                rr.round_number,
                rr.total_raffles,
                rr.started_at,
                rr.ended_at,
                rr.winner_raffle_id,
                rr.status,
                u.nombre as winner_nombre,
                u.apellido as winner_apellido,
                u.dni as winner_dni,
                u.celular as winner_celular
            FROM raffle_rounds rr
            LEFT JOIN users u ON rr.winner_user_id = u.id
            ORDER BY rr.round_number DESC
            LIMIT 50
        `);

        res.json(history.rows);
    } catch (error) {
        console.error('❌ Error fetching history:', error);
        next(error);
    }
});

/**
 * PUT /api/admin/carousel/:id
 * Actualiza un premio del carrusel (ahora con URL de imagen)
 */
router.put('/carousel/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, imagen_url, orden } = req.body;

        // Validar URL de imagen
        if (imagen_url && !imagen_url.match(/^https?:\/\/.+/)) {
            return res.status(400).json({ error: 'URL de imagen inválida' });
        }

        await db.query(`
            UPDATE carousel_items 
            SET titulo = $1,
                descripcion = $2,
                imagen_url = $3,
                orden = $4
            WHERE id = $5
        `, [titulo, descripcion, imagen_url, orden, id]);

        res.json({ success: true, message: 'Premio actualizado' });
    } catch (error) {
        console.error('❌ Error updating carousel:', error);
        next(error);
    }
});

/**
 * POST /api/admin/carousel
 * Crea un nuevo premio en el carrusel (con URL de imagen)
 */
router.post('/carousel', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { titulo, descripcion, imagen_url, orden } = req.body;

        // Validar URL de imagen
        if (!imagen_url || !imagen_url.match(/^https?:\/\/.+/)) {
            return res.status(400).json({ error: 'URL de imagen válida es requerida' });
        }

        const result = await db.query(`
            INSERT INTO carousel_items (titulo, descripcion, imagen_url, orden)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [titulo, descripcion, imagen_url, orden || 0]);

        res.json({
            success: true,
            message: 'Premio creado',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('❌ Error creating carousel item:', error);
        next(error);
    }
});

/**
 * GET /api/admin/stats
 * Estadísticas del sistema para el admin
 */
router.get('/stats', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM raffles WHERE status = 'available') as available,
                (SELECT COUNT(*) FROM raffles WHERE status = 'reserved') as reserved,
                (SELECT COUNT(*) FROM raffles WHERE status = 'sold') as sold,
                (SELECT COUNT(*) FROM raffles) as total,
                (SELECT COUNT(DISTINCT purchased_by) FROM raffles WHERE status = 'sold') as unique_buyers,
                (SELECT SUM(amount) FROM transactions WHERE status = 'completed') as total_revenue,
                (SELECT round_number FROM raffle_rounds WHERE status = 'active' LIMIT 1) as current_round
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        next(error);
    }
});

module.exports = router;
