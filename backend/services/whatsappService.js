const axios = require('axios');

class WhatsAppService {
    constructor() {
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
    }

    /**
     * Enviar mensaje de texto a WhatsApp
     */
    async sendTextMessage(to, message) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('WhatsApp message sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar notificación de compra de rifa
     */
    async sendPurchaseNotification(user, raffleNumbers, totalAmount) {
        const phoneNumber = this.formatPhoneNumber(user.celular);

        const message = `
🎉 *¡Compra Confirmada!*

Hola ${user.nombre} ${user.apellido},

Tu compra ha sido procesada exitosamente:

🎫 *Número(s) de Rifa:* ${raffleNumbers.join(', ')}
💰 *Total Pagado:* S/ ${totalAmount.toFixed(2)}
📝 *DNI:* ${user.dni}

¡Mucha suerte! 🍀

_Sistema de Rifas_
        `.trim();

        return await this.sendTextMessage(phoneNumber, message);
    }

    /**
     * Enviar notificación de reserva
     */
    async sendReservationNotification(user, raffleNumber) {
        const phoneNumber = this.formatPhoneNumber(user.celular);

        const message = `
⏰ *Rifa Reservada*

Hola ${user.nombre},

Has reservado la rifa N° *${raffleNumber}*

⚠️ Tienes *5 minutos* para completar el pago.

¡No pierdas tu oportunidad!

_Sistema de Rifas_
        `.trim();

        return await this.sendTextMessage(phoneNumber, message);
    }

    /**
     * Enviar notificación de expiración de reserva
     */
    async sendReservationExpiredNotification(user, raffleNumber) {
        const phoneNumber = this.formatPhoneNumber(user.celular);

        const message = `
❌ *Reserva Expirada*

Hola ${user.nombre},

Tu reserva de la rifa N° *${raffleNumber}* ha expirado.

Puedes intentar reservarla nuevamente si aún está disponible.

_Sistema de Rifas_
        `.trim();

        return await this.sendTextMessage(phoneNumber, message);
    }

    /**
     * Enviar notificación al administrador sobre una compra
     * Esta notificación se envía al número configurado en WHATSAPP_ADMIN_NUMBER
     */
    async sendAdminPurchaseNotification(user, raffleNumbers, totalAmount) {
        const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;

        if (!adminNumber) {
            console.log('⚠️  WHATSAPP_ADMIN_NUMBER no configurado - notificación de admin omitida');
            return;
        }

        const raffleList = Array.isArray(raffleNumbers) ? raffleNumbers.join(', ') : raffleNumbers;

        const message = `
🎉 *Nueva Compra Registrada*

📋 *Detalles de la venta:*

👤 *Cliente:* ${user.nombre} ${user.apellido}
📝 *DNI:* ${user.dni}
📱 *Teléfono:* ${user.celular}

🎫 *Rifa(s):* ${raffleList}
💰 *Monto:* S/ ${totalAmount.toFixed(2)}

⏰ ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}

_Sistema de Rifas - Notificación Automática_
        `.trim();

        return await this.sendTextMessage(adminNumber, message);
    }

    /**
     * Enviar notificación de compra usando MESSAGE TEMPLATE (aprobado por Meta)
     * Este método NO tiene restricción de 24 horas
     */
    async sendPurchaseTemplate(user, raffleNumbers, totalAmount) {
        const phoneNumber = this.formatPhoneNumber(user.celular);
        const raffleList = Array.isArray(raffleNumbers) ? raffleNumbers.join(', ') : raffleNumbers;

        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: phoneNumber,
                    type: 'template',
                    template: {
                        name: 'cliente',  // Nombre del template aprobado
                        language: { code: 'es' },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: user.nombre },  // {{1}}
                                    { type: 'text', text: raffleList },   // {{2}}
                                    { type: 'text', text: totalAmount.toFixed(2) }, // {{3}}
                                    { type: 'text', text: user.dni }      // {{4}}
                                ]
                            }
                        ]
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('WhatsApp template message sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending WhatsApp template:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar notificación al admin usando MESSAGE TEMPLATE (aprobado por Meta)
     */
    async sendAdminTemplate(user, raffleNumbers, totalAmount) {
        const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;

        if (!adminNumber) {
            console.log('⚠️  WHATSAPP_ADMIN_NUMBER no configurado');
            return;
        }

        const raffleList = Array.isArray(raffleNumbers) ? raffleNumbers.join(', ') : raffleNumbers;
        const formattedAdmin = this.formatPhoneNumber(adminNumber);

        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: formattedAdmin,
                    type: 'template',
                    template: {
                        name: 'admin',  // Nombre del template aprobado
                        language: { code: 'es' },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: `${user.nombre} ${user.apellido}` }, // {{1}}
                                    { type: 'text', text: user.dni },        // {{2}}
                                    { type: 'text', text: user.celular },    // {{3}}
                                    { type: 'text', text: raffleList },      // {{4}}
                                    { type: 'text', text: totalAmount.toFixed(2) } // {{5}}
                                ]
                            }
                        ]
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('WhatsApp admin template sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending admin template:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Formatear número de teléfono para WhatsApp
     */
    formatPhoneNumber(phone) {
        // Remover todos los caracteres no numéricos excepto el +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // Asegurar que empiece con +51 (Perú)
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        if (!cleaned.startsWith('+51')) {
            cleaned = '+51' + cleaned.replace(/^\+?51?/, '');
        }

        return cleaned;
    }

    /**
     * Enviar mensaje con template (para mensajes pre-aprobados)
     */
    async sendTemplateMessage(to, templateName, languageCode = 'es', components = []) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components: components
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error sending template message:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new WhatsAppService();
