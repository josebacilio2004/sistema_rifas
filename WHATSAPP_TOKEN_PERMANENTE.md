# ⚠️ Tu Access Token de WhatsApp EXPIRÓ

## 🔴 Problema:

El Access Token que configuraste era **TEMPORAL** y expiró el 13-Ene-2026.

Por eso:
- ❌ WhatsApp no envía notificaciones
- ❌ n8n no puede conectarse a WhatsApp
- ❌ Sistema de verificación automática no funciona

---

## ✅ Solución: Generar Token PERMANENTE

### Paso 1: Ir a Meta Business Suite

1. URL: https://business.facebook.com/settings/system-users
2. Login con tu cuenta de Facebook

### Paso 2: Crear/Seleccionar System User

1. Click en **"Add"** o selecciona el que ya creaste
2. Nombre: "n8n_bot" o el que tengas

### Paso 3: Asignar App

1. Click en el System User
2. **"Add Assets"** → **"Apps"**
3. Seleccionar tu app (ID: 1252880746905000)
4. Rol: **Admin**
5. **Save**

### Paso 4: GENERAR TOKEN PERMANENTE

1. En System User → **"Generate New Token"**
2. Seleccionar tu app
3. **Permisos necesarios:**
   - ☑️ `whatsapp_business_messaging`
   - ☑️ `whatsapp_business_management`
   - ☑️ `business_management`

4. **Token Expiration:** **NEVER** ← IMPORTANTE!

5. **Generate Token**

6. **COPIAR inmediatamente** (solo se muestra una vez)

---

## 📝 Actualizar Credenciales

### En n8n Cloud:

1. Ir a: https://josebac1.app.n8n.cloud/
2. **Credentials** → Buscar "WhatsApp Rifas"
3. **Edit**
4. **Access Token:** Pegar el NUEVO token permanente
5. **Save**

### En Backend (Variables de Entorno Render):

1. Render Dashboard → Backend service
2. **Environment** → Variables
3. Buscar `WHATSAPP_ACCESS_TOKEN`
4. Actualizar con el nuevo token
5. **Save** → Render redesplegará

---

## ⏱️ Una vez actualizado:

1. WhatsApp empezará a funcionar
2. n8n podrá conectarse
3. Sistema de verificación automática funcionará

---

## 🎯 Confirmación:

Dame el nuevo token y actualizo todo por ti en n8n y backend.

**O sígueme los pasos de arriba y dime cuando lo tengas.**
