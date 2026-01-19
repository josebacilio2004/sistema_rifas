// Add this NEW endpoint to backend/routes/raffles.js
// Insert BEFORE the existing POST /:id/purchase endpoint (around line 220)

/**
 * POST /api/raffles/purchase-batch
 * SIMPLE: Purchase multiple raffles in ONE transaction
 */
router.post('/purchase-batch', async (req, res, next) => {
    try {
        const { raffle_ids, user_id, yape_operation_code, yape_sender_name } = req.body;

        console.log('🔵 Batch purchase:', { raffle_ids, user_id, yape_operation_code, yape_sender_name });

        // Validate input
        if (!Array.isArray(raffle_ids) || raffle_ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos una rifa' });
        }
        if (!yape_operation_code || !yape_sender_name) {
            return res.status(400).json({ error: 'Código Yape y nombre requeridos' });
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

        console.log(`✅ Batch purchase OK: ${raffle_ids.length} rifas, transaction ${transactionId}`);

        res.json({
            success: true,
            transaction_id: transactionId,
            raffle_count: raffle_ids.length,
            total_amount: totalAmount,
            raffle_ids: raffle_ids
        });

    } catch (error) {
        console.error('❌ Batch purchase error:', error);
        next(error);
    }
});
