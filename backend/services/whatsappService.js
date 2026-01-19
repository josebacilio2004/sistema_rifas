const axios = require('axios');

/**
 * WhatsApp Business API Service
 * Envía notificaciones usando templates aprobados
 */
class WhatsAppService {
    constructor() {
        // Token único para toda la app "Y si gano?"
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        // Phone Number IDs separados para cada función
        this.adminPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID_ADMIN;  // +51 964 910 248
        this.customerPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID_CUSTOMER;  // +51 972 107 074
        this.adminPhone = process.env.WHATSAPP_ADMIN_NUMBER;

        this.apiVersion = 'v18.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

        if (!this.accessToken) {
            console.warn('⚠️ WhatsApp access token not configured');
        }

        if (!this.adminPhoneNumberId) {
            console.warn('⚠️ WhatsApp ADMIN phone number ID not configured');
        }

        if (!this.customerPhoneNumberId) {
            console.warn('⚠️ WhatsApp CUSTOMER phone number ID not configured');
        }
    }

    /**
     * Enviar notificación de pago pendiente al admin
     * Usa template "admin" con cuenta ADMIN
     */
    async notifyAdminNewPayment({
        customerName,
        customerDNI,
        customerPhone,
        raffleId,
        amount,
        yapeCode,
        yapeSender
    }) {
        if (!this.accessToken || !this.adminPhoneNumberId) {
            console.log('⚠️ WhatsApp not configured, skipping admin notification');
            return null;
        }

        try {
            const adminPhone = this.adminPhone.replace(/[^0-9]/g, ''); // Remove + and spaces

            // Template "admin" params: nombre, DNI, Tel, Rifa, Monto
            const payload = {
                messaging_product: 'whatsapp',
                to: adminPhone,
                type: 'template',
                template: {
                    name: 'admin',
                    language: { code: 'es' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: customerName || 'Guest' },
                                { type: 'text', text: customerDNI || 'No proporcionado' },
                                { type: 'text', text: customerPhone || 'No proporcionado' },
                                { type: 'text', text: `#${raffleId}` },
                                { type: 'text', text: amount.toString() }
                            ]
                        }
                    ]
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/${this.adminPhoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ WhatsApp admin notification sent:', response.data);

            // Enviar mensaje adicional con datos Yape (mensaje libre en ventana de 24h)
            await this.sendYapeDetails(adminPhone, { yapeCode, yapeSender, raffleId });

            return response.data;
        } catch (error) {
            console.error('❌ WhatsApp notification failed:', error.response?.data || error.message);
            // No lanzar error para no bloquear el pago
            return null;
        }
    }

    /**
     * Enviar detalles de Yape como mensaje de seguimiento
     * Usa cuenta ADMIN
     */
    async sendYapeDetails(adminPhone, { yapeCode, yapeSender, raffleId }) {
        try {
            const message = `📱 *Datos Yape - Rifa #${raffleId}*\n\n` +
                `Código: ${yapeCode}\n` +
                `Yapero: ${yapeSender}\n\n` +
                `🔗 Panel Admin: https://josebacilio2004.github.io/sistema_rifas/admin.html`;

            const payload = {
                messaging_product: 'whatsapp',
                to: adminPhone,
                type: 'text',
                text: { body: message }
            };

            await axios.post(
                `${this.baseUrl}/${this.adminPhoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Yape details sent');
        } catch (error) {
            console.error('⚠️ Could not send Yape details:', error.response?.data?.error?.message || error.message);
        }
    }

    /**
     * Enviar confirmación de compra al cliente
     * Usa template "cliente" con cuenta CLIENTE (número nuevo)
     */
    async notifyCustomerPurchaseApproved({
        customerPhone,
        customerName,
        raffleId,
        amount,
        customerDNI
    }) {
        if (!this.accessToken || !this.customerPhoneNumberId || !customerPhone) {
            console.log('⚠️ WhatsApp not configured or no customer phone, skipping notification');
            return null;
        }

        try {
            const phone = customerPhone.replace(/[^0-9]/g, '');

            // Template "cliente" params: nombre, Rifa, Total, DNI
            const payload = {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'cliente',
                    language: { code: 'es' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: customerName },
                                { type: 'text', text: `#${raffleId}` },
                                { type: 'text', text: amount.toString() },
                                { type: 'text', text: customerDNI }
                            ]
                        }
                    ]
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/${this.customerPhoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ WhatsApp customer confirmation sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ WhatsApp customer notification failed:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Enviar mensaje de prueba
     */
    async sendTestMessage(phone) {
        try {
            const cleanPhone = phone.replace(/[^0-9]/g, '');

            const payload = {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'text',
                text: { body: '✅ WhatsApp configurado correctamente! Sistema de Rifas.' }
            };

            const response = await axios.post(
                `${this.baseUrl}/${this.customerPhoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error?.message || error.message);
        }
    }

    /**
     * Notificar al ganador del sorteo
     */
    async notifyWinner({ customerPhone, customerName, raffleId }) {
        if (!this.accessToken || !this.customerPhoneNumberId || !customerPhone) {
            console.log('⚠️ WhatsApp not configured or no customer phone');
            return null;
        }

        try {
            const phone = customerPhone.replace(/[^0-9]/g, '');

            const message = `🎉 *¡FELICIDADES ${customerName.toUpperCase()}!* 🎉\n\n` +
                `¡Has ganado el sorteo con la rifa #${raffleId}!\n\n` +
                `Nos pondremos en contacto contigo pronto para coordinar la entrega de tu premio.\n\n` +
                `¡Gracias por participar! 🎁`;

            const payload = {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: message }
            };

            const response = await axios.post(
                `${this.baseUrl}/${this.customerPhoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Winner notification sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Winner notification failed:', error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = new WhatsAppService();
