const db = require('./database');
const axios = require('axios');

const RESERVATION_TIMEOUT_MINUTES = 5;

/**
 * Clean up expired reservations
 * Called by cron job every minute
 */
async function cleanExpiredReservations() {
    try {
        const expirationTime = new Date(Date.now() - RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

        // Find expired reservations
        const expiredResult = await db.query(
            `SELECT id, reserved_by 
             FROM raffles 
             WHERE status = 'reserved' 
             AND reserved_at < $1`,
            [expirationTime]
        );

        if (expiredResult.rows.length === 0) {
            return;
        }

        console.log(`Found ${expiredResult.rows.length} expired reservations, releasing...`);

        // Release expired reservations
        const releaseResult = await db.query(
            `UPDATE raffles 
             SET status = 'available', 
                 reserved_by = NULL, 
                 reserved_at = NULL 
             WHERE status = 'reserved' 
             AND reserved_at < $1 
             RETURNING id`,
            [expirationTime]
        );

        // Send webhook notification for each released raffle
        for (const row of releaseResult.rows) {
            await sendWebhookNotification({
                event: 'reservation_expired',
                raffle_id: row.id,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`✓ Released ${releaseResult.rowCount} expired reservations`);
    } catch (error) {
        console.error('Error cleaning expired reservations:', error);
    }
}

/**
 * Check if a raffle is reserved and not expired
 */
async function isReservationValid(raffleId) {
    const expirationTime = new Date(Date.now() - RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

    const result = await db.query(
        `SELECT id FROM raffles 
         WHERE id = $1 
         AND status = 'reserved' 
         AND reserved_at > $2`,
        [raffleId, expirationTime]
    );

    return result.rows.length > 0;
}

/**
 * Get time remaining for a reservation in seconds
 */
async function getReservationTimeRemaining(raffleId) {
    const result = await db.query(
        `SELECT reserved_at FROM raffles 
         WHERE id = $1 AND status = 'reserved'`,
        [raffleId]
    );

    if (result.rows.length === 0) {
        return 0;
    }

    const reservedAt = new Date(result.rows[0].reserved_at);
    const expiresAt = new Date(reservedAt.getTime() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000);
    const now = new Date();
    const remainingMs = expiresAt - now;

    return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Send webhook notification to n8n
 */
async function sendWebhookNotification(data) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes('localhost')) {
        console.log('Webhook notification (n8n not configured):', data);
        return;
    }

    try {
        await axios.post(webhookUrl, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        console.log('✓ Webhook notification sent:', data.event);
    } catch (error) {
        console.error('Failed to send webhook notification:', error.message);
    }
}

module.exports = {
    cleanExpiredReservations,
    isReservationValid,
    getReservationTimeRemaining,
    sendWebhookNotification,
    RESERVATION_TIMEOUT_MINUTES
};
