# n8n Self-Hosted en Render (Gratis) - Guía Completa

## 🎯 Por qué esta opción

- ✅ **100% Gratis** - Plan gratuito de Render
- ✅ **n8n completo** - Todas las funciones sin límites
- ✅ **Siempre activo** - No se apaga (a diferencia del backend que sí duerme)
- ✅ **Conectado a WhatsApp** - Funciona 24/7

## 📋 Pasos de Deployment

### 1. Crear Archivo de Configuración

Crear `render-n8n.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: sistema-rifas-n8n
    runtime: docker
    dockerfilePath: ./Dockerfile.n8n
    envVars:
      - key: N8N_BASIC_AUTH_ACTIVE
        value: true
      - key: N8N_BASIC_AUTH_USER
        value: admin
      - key: N8N_BASIC_AUTH_PASSWORD
        generateValue: true
      - key: N8N_HOST
        value: 0.0.0.0
      - key: N8N_PORT
        value: 10000
      - key: N8N_PROTOCOL
        value: https
      - key: WEBHOOK_URL
        value: https://sistema-rifas-n8n.onrender.com
      - key: BACKEND_URL
        value: https://sistema-rifas-backend.onrender.com
      - key: YAPE_WEBHOOK_SECRET
        value: 26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f
      - key: ADMIN_WHATSAPP
        value: 51964910248
```

### 2. Crear Dockerfile para n8n

Crear `Dockerfile.n8n`:

```dockerfile
FROM n8nio/n8n:latest

# Ejecutar n8n
CMD ["n8n"]
```

### 3. Deploy en Render

1. Ir a [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Conectar tu repositorio GitHub
4. Configurar:
   - **Name:** sistema-rifas-n8n
   - **Runtime:** Docker
   - **Dockerfile Path:** Dockerfile.n8n
   - **Plan:** Free

5. Agregar variables de entorno (las del yaml arriba)

6. Click "Create Web Service"

### 4. Acceder a n8n

Una vez desplegado:
- URL: `https://sistema-rifas-n8n.onrender.com`
- Login con credenciales que configuraste

### 5. Importar Workflow

1. Abrir n8n en la URL de Render
2. Importar `n8n-yape-verification-workflow.json`
3. Ajustar URL del webhook:
   - Cambiar `http://backend:3000` por `https://sistema-rifas-backend.onrender.com`
4. Activar workflow

---

## ⚠️ Limitaciones Plan Gratuito Render

- **750 horas/mes** - Suficiente para n8n (siempre activo)
- **Se apaga después de 15 min de inactividad** - Pero n8n webhooks lo mantienen activo
- **Reinicio automático** - Al recibir request

---

## 🔄 Alternativa: Railway (También Gratis)

Si prefieres Railway en lugar de Render:

1. Ir a [Railway.app](https://railway.app/)
2. Deploy from GitHub
3. Seleccionar Dockerfile.n8n
4. Configurar variables
5. Listo

Railway ofrece $5 de crédito gratis mensual (suficiente para n8n pequeño).

---

## 📱 Conectar WhatsApp Business API

Para que n8n reciba mensajes de Yape:

### Opción A: WhatsApp Business Cloud API (Meta)
- Gratis hasta cierto límite
- Requiere verificación de negocio
- Configurar webhook apuntando a n8n en Render

### Opción B: Twilio WhatsApp
- Sandbox gratuito para testing
- Limitado pero funcional

---

## ✅ Ventajas de esta solución

| Característica | Beneficio |
|----------------|-----------|
| Costo | $0 - Completamente gratis |
| Uptime | 24/7 con webhooks |
| Escalabilidad | Puede manejar muchos pagos |
| Mantenimiento | Mínimo, auto-actualiza |

---

## 🎉 Resultado Final

```
Usuario paga Yape
     ↓
Yape envía WhatsApp
     ↓
Meta/Twilio webhook → n8n (Render)
     ↓
n8n parsea → Backend (Render)
     ↓
Backend verifica → DB (Neon)
     ↓
Frontend polling → Usuario confirmado ✅
```

**Todo funcionando en planes gratuitos!**
