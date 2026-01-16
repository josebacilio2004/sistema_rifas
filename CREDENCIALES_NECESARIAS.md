# Credenciales Necesarias para Sistema Automatizado

## 📱 WhatsApp Business API (Meta/Facebook)

Para que n8n pueda recibir mensajes de Yape automáticamente, necesito:

### 1. Facebook Developer App

**Lo que necesito:**
```
App ID: _________________
App Secret: _________________
```

**Cómo obtenerlos:**
1. Ir a: https://developers.facebook.com/apps/
2. Seleccionar tu app (o crear una nueva)
3. Settings → Basic
4. Copiar "App ID" y "App Secret"

---

### 2. WhatsApp Business Account

**Lo que necesito:**
```
Phone Number ID: _________________
(El ID del número de WhatsApp, no el número en sí)

WhatsApp Business Account ID: _________________
```

**Cómo obtenerlos:**
1. En Facebook Developers → Tu App
2. WhatsApp → API Setup
3. Copiar "Phone number ID"
4. Copiar "WhatsApp Business Account ID"

---

### 3. Access Token (MUY IMPORTANTE)

**Lo que necesito:**
```
Access Token (Permanente): _________________
```

**Cómo obtenerlo:**
1. Facebook Developers → Tu App → WhatsApp → API Setup
2. Generar "Permanent Access Token" (no el temporal)
3. Scope debe incluir: `whatsapp_business_messaging`, `whatsapp_business_management`

**⚠️ IMPORTANTE:** El token temporal expira en 24h. Necesitas el PERMANENTE.

---

### 4. Webhook Verify Token

**Lo que necesito:**
```
Verify Token: _________________
(Puedes inventar uno, ej: MiToken123Seguro)
```

Este lo usarás para verificar el webhook.

---

### 5. Número de WhatsApp

**Lo que necesito:**
```
Número de WhatsApp (con código país): +51964910248
```

Confirma que este es el número correcto que recibirá los mensajes de Yape.

---

## 🎯 Información Adicional

### Tu Backend URL:
```
https://sistema-rifas-backend.onrender.com
```

### Tu n8n URL:
```
https://sistema-rifas-n8n.onrender.com
```

---

## 📋 Configuración que Haré

Una vez me des las credenciales, configuraré:

1. **n8n Credentials:**
   - WhatsApp Business Account
   - Access Token
   - Phone Number ID

2. **Webhook de Facebook:**
   - URL: `https://sistema-rifas-n8n.onrender.com/webhook/whatsapp`
   - Verify Token: (el que me des)
   - Suscripciones: `messages`

3. **n8n Workflow:**
   - Recibir mensajes de WhatsApp
   - Filtrar mensajes de Yape
   - Parsear código de operación
   - Llamar webhook backend
   - Verificar pago automáticamente

4. **Testing:**
   - Enviar mensaje de prueba
   - Verificar que n8n lo recibe
   - Confirmar que backend se actualiza

---

## ⏱️ Tiempo Estimado

**Con credenciales:** 15-20 minutos de configuración

---

## ✅ Checklist de lo que tengo listo:

- ✅ n8n deployado en Render
- ✅ Backend con endpoints webhook
- ✅ Base de datos configurada
- ✅ Frontend con polling
- ✅ Workflow n8n creado

**Solo falta:** Conectar WhatsApp Business API

---

## 🚀 Próximos Pasos

1. **TÚ:** Me das las credenciales arriba
2. **YO:** Configuro todo en n8n
3. **YO:** Configuro webhook en Facebook
4. **NOSOTROS:** Probamos con mensaje real
5. **LISTO:** Sistema 100% automatizado

---

## 🎁 Bonus: Templates WhatsApp

Ya tienes templates creados:
- `admin` - Para notificar compra
- `cliente` - Para confirmar compra

Los configuraremos para enviar notificaciones automáticas después de verificar el pago.

---

**Dame las credenciales cuando las tengas y configuro todo en vivo! 🚀**
