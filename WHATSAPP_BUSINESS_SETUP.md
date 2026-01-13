# 📱 Guía Completa: Implementación de WhatsApp Business API

Esta guía te ayudará a configurar WhatsApp Business API para enviar notificaciones automáticas cuando se vendan rifas en tu sistema.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Meta Business](#configuración-de-meta-business)
3. [Obtención de Credenciales](#obtención-de-credenciales)
4. [Implementación en el Backend](#implementación-en-el-backend)
5. [Configuración de Webhooks](#configuración-de-webhooks)
6. [Pruebas](#pruebas)
7. [Solución de Problemas](#solución-de-problemas)

---

## 1. Requisitos Previos

### ✅ Lo que necesitas:

- **Cuenta de Meta Business**: [business.facebook.com](https://business.facebook.com)
- **Número de teléfono dedicado**: Un número que no esté registrado en WhatsApp personal
- **Verificación empresarial**: Tu negocio debe estar verificado por Meta
- **Servidor con HTTPS**: Para recibir webhooks (tu servidor Render ya lo tiene)
- **Tarjeta de crédito**: Para activar la API (Meta ofrece 1,000 mensajes gratis/mes)

---

## 2. Configuración de Meta Business

### Paso 1: Crear una Meta App

1. Ve a **[Meta for Developers](https://developers.facebook.com/)**
2. Haz clic en **"My Apps"** → **"Create App"**
3. Selecciona **"Business"** como tipo de aplicación
4. Completa la información:
   - **Display Name**: "Sistema de Rifas"
   - **App Contact Email**: Tu email
   - **Business Account**: Selecciona o crea una
5. Haz clic en **"Create App"**

### Paso 2: Agregar WhatsApp a tu App

1. En el dashboard de tu app, busca **"WhatsApp"**
2. Haz clic en **"Set up"**
3. Selecciona tu **Business Account**
4. Te llevará al **WhatsApp API Setup**

### Paso 3: Configurar Número de Teléfono

1. En la sección **"API Setup"**, haz clic en **"Add Phone Number"**
2. Opciones:
   - **Opción A**: Usar número de prueba (solo para desarrollo)
   - **Opción B**: Agregar tu propio número (recomendado para producción)

#### Para agregar tu número:
1. Haz clic en **"Add phone number"**
2. Ingresa el número de teléfono (ej: +51987654321)
3. Recibirás un código de verificación por SMS
4. Ingresa el código para verificar
5. Acepta los términos de WhatsApp Business

---

## 3. Obtención de Credenciales

### Paso 1: Obtener el Phone Number ID

1. En **WhatsApp → API Setup**
2. Copia el **Phone Number ID** (número largo, ej: `123456789012345`)
3. Guárdalo, lo necesitarás para el código

### Paso 2: Obtener el Access Token

#### Token Temporal (para pruebas):
1. En **WhatsApp → API Setup**
2. Copia el **Temporary Access Token**
3. ⚠️ **Este token expira en 24 horas**

#### Token Permanente (para producción):
1. Ve a **Settings → Basic**
2. Haz clic en **"Generate"** en App Secret
3. Copia el **App Secret**
4. Ve a **Business Settings → System Users**
5. Haz clic en **"Add"** y crea un usuario del sistema
6. Dale permisos de **"Admin"**
7. Genera un token con estos permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
8. **Guarda este token de forma segura** - no lo verás de nuevo

### Paso 3: Obtener el Business Account ID

1. Ve a **WhatsApp → API Setup**
2. Encuentra **"WhatsApp Business Account ID"**
3. Cópialo y guárdalo

---

## 4. Implementación en el Backend

### Paso 1: Instalar Dependencias

```bash
cd backend
npm install axios
```

### Paso 2: Configurar Variables de Entorno

Crea o actualiza el archivo `.env`:

```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id_aqui
WHATSAPP_ACCESS_TOKEN=tu_access_token_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id_aqui
WHATSAPP_API_VERSION=v18.0
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123
```

### Paso 3: Crear Servicio de WhatsApp

Crea el archivo `backend/services/whatsappService.js`:

```javascript
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
    async sendTemplateMessage(to, templateName, languageCode = 'es') {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode }
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
```

### Paso 4: Integrar con las Rutas de Rifas

Actualiza `backend/routes/raffles.js` para incluir notificaciones:

```javascript
const whatsappService = require('../services/whatsappService');

// En la función de compra de rifa (purchase)
router.post('/raffles/:id/purchase', async (req, res) => {
    const raffleId = parseInt(req.params.id);
    const { userId } = req.body;

    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // ... tu código existente de compra ...

            await client.query('COMMIT');

            // 🆕 ENVIAR NOTIFICACIÓN DE WHATSAPP
            try {
                await whatsappService.sendPurchaseNotification(
                    user,
                    [raffleId],
                    5.00
                );
            } catch (whatsappError) {
                console.error('WhatsApp notification failed:', whatsappError);
                // No fallar la compra si falla WhatsApp
            }

            res.json({
                success: true,
                message: 'Rifa comprada exitosamente',
                raffle: { /* ... */ }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## 5. Configuración de Webhooks

Los webhooks permiten recibir actualizaciones de WhatsApp (ej: estado de entrega de mensajes).

### Paso 1: Crear Endpoint de Webhook

Crea `backend/routes/webhooks.js`:

```javascript
const express = require('express');
const router = express.Router();

// Verificación del webhook (Meta lo llama al configurar)
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified!');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Recibir eventos de WhatsApp
router.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        body.entry?.forEach(entry => {
            const changes = entry.changes;
            changes?.forEach(change => {
                if (change.field === 'messages') {
                    const value = change.value;
                    
                    // Procesar estado de mensaje
                    if (value.statuses) {
                        value.statuses.forEach(status => {
                            console.log('Message status:', status);
                            // status.status puede ser: sent, delivered, read, failed
                        });
                    }
                }
            });
        });

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
```

### Paso 2: Agregar Ruta al Server

En `backend/server.js`:

```javascript
const webhooksRouter = require('./routes/webhooks');

// ... otras rutas ...

app.use('/api', webhooksRouter);
```

### Paso 3: Configurar Webhook en Meta

1. Ve a tu app en **Meta for Developers**
2. En **WhatsApp → Configuration**
3. Haz clic en **"Edit"** en Webhook
4. Ingresa:
   - **Callback URL**: `https://tu-app.onrender.com/api/webhook`
   - **Verify Token**: El mismo valor que pusiste en `.env` (ej: `mi_token_secreto_123`)
5. Haz clic en **"Verify and Save"**
6. Suscríbete a estos campos:
   - ✅ `messages`
   - ✅ `message_status`

---

## 6. Pruebas

### Paso 1: Probar el Servicio Localmente

Crea un archivo de prueba `backend/test-whatsapp.js`:

```javascript
require('dotenv').config();
const whatsappService = require('./services/whatsappService');

async function testWhatsApp() {
    try {
        const testUser = {
            nombre: 'Juan',
            apellido: 'Pérez',
            dni: '12345678',
            celular: '+51987654321' // 🔄 CAMBIAR POR TU NÚMERO
        };

        console.log('Enviando mensaje de prueba...');
        
        await whatsappService.sendPurchaseNotification(
            testUser,
            [42],
            5.00
        );

        console.log('✅ Mensaje enviado exitosamente!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testWhatsApp();
```

Ejecutar:

```bash
node backend/test-whatsapp.js
```

### Paso 2: Verificar en el Panel de Meta

1. Ve a **WhatsApp → Getting Started**
2. Busca la sección **"Send and receive messages"**
3. Deberías ver los mensajes enviados en el historial

---

## 7. Solución de Problemas

### ❌ Error: "Invalid OAuth access token"

**Solución:**
- Verifica que el `WHATSAPP_ACCESS_TOKEN` sea correcto
- Si usas token temporal, genera uno nuevo (expiran en 24h)
- Para producción, usa un token permanente

### ❌ Error: "Phone number not found"

**Solución:**
- Verifica que el `WHATSAPP_PHONE_NUMBER_ID` sea correcto
- Asegúrate de que el número esté verificado en Meta

### ❌ Error: "Recipient phone number not valid"

**Solución:**
- El número debe incluir código de país: `+51987654321`
- Verifica el formato con la función `formatPhoneNumber()`
- El número debe estar activo en WhatsApp

### ❌ Los mensajes no llegan

**Posibles causas:**
1. **Número no verificado**: Verifica tu número en Meta
2. **Plantilla no aprobada**: Para producción, usa templates aprobados
3. **Límites de API**: Meta limita mensajes en cuentas nuevas
4. **Número bloqueado**: El destinatario te bloqueó

### ❌ Error: "Message type not supported"

**Solución:**
- En producción (después de 24h), debes usar **Message Templates**
- Crea y aprueba templates en **WhatsApp → Message Templates**

---

## 📝 Notas Importantes

### Límites y Costos

- **Primeros 1,000 mensajes/mes**: GRATIS
- **Después de 1,000**: ~$0.005 - $0.01 por mensaje (varía por país)
- **Límites de tier**:
  - Tier 1: 1,000 conversaciones/día
  - Tier 2: 10,000 conversaciones/día
  - Se aumenta automáticamente con buen historial

### Conversaciones vs Mensajes

- WhatsApp cobra por **"conversaciones"** de 24 horas
- Puedes enviar múltiples mensajes dentro de una conversación
- Tipos:
  - **User-initiated**: El usuario te escribe primero (más barato)
  - **Business-initiated**: Tú inicias la conversación (requiere template)

### Templates para Producción

Después de las primeras 24 horas de prueba, necesitas usar **Message Templates** aprobados por Meta:

1. Ve a **WhatsApp → Message Templates**
2. Haz clic en **"Create Template"**
3. Ejemplo de template para compra:

```
Nombre: purchase_confirmation
Categoría: TRANSACTIONAL
Idioma: Spanish

Cuerpo:
¡Hola {{1}}! Tu compra ha sido confirmada.
Rifa N° {{2}}
Total: S/ {{3}}
¡Mucha suerte!
```

4. Enviar para aprobación (puede tardar 24-48h)
5. Usar con `sendTemplateMessage()`

---

## 🚀 Deployment en Render

### Actualizar Variables de Entorno

1. Ve a tu dashboard de **Render**
2. Selecciona tu servicio backend
3. Ve a **Environment**
4. Agrega las variables:
   ```
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_BUSINESS_ACCOUNT_ID=...
   WHATSAPP_VERIFY_TOKEN=...
   ```
5. Haz clic en **"Save Changes"**
6. El servicio se redesplegará automáticamente

---

## ✅ Checklist Final

- [ ] Cuenta de Meta Business creada
- [ ] App de WhatsApp creada y configurada
- [ ] Número de teléfono verificado
- [ ] Credenciales obtenidas y guardadas
- [ ] Dependencias instaladas (`npm install axios`)
- [ ] Variables de entorno configuradas
- [ ] Servicio de WhatsApp creado
- [ ] Integración con rutas completada
- [ ] Webhooks configurados
- [ ] Pruebas locales exitosas
- [ ] Variables en Render configuradas
- [ ] Template messages creados (para producción)

---

## 📚 Recursos Adicionales

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Guía de Plantillas](https://developers.facebook.com/docs/whatsapp/message-templates)
- [WhatsApp API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Webhooks Setup](https://developers.facebook.com/docs/whatsapp/webhooks)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en Render
2. Verifica el **Activity Log** en Meta for Developers
3. Consulta la [WhatsApp Business API FAQ](https://developers.facebook.com/docs/whatsapp/faq)

¡Buena suerte con tu implementación! 🎉
