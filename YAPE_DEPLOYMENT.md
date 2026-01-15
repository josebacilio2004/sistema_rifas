# Guía de Deployment - Sistema Yape Verification

## 🚀 Pasos para Activar en Producción

### 1. Base de Datos (Neon) ⚡

1. Ir a [Neon Console](https://console.neon.tech/)
2. Seleccionar tu proyecto
3. Click en "SQL Editor"
4. Copiar y ejecutar:

```sql
-- Migración 004: Yape Verification
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS yape_operation_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS yape_sender_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS verified_by_webhook BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_verified_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_yape_operation_code ON transactions(yape_operation_code);
CREATE INDEX IF NOT EXISTS idx_webhook_verified ON transactions(verified_by_webhook, status);
```

5. Click "Run" ✅

---

### 2. Backend (Render) 🔧

1. Ir a [Render Dashboard](https://dashboard.render.com/)
2. Seleccionar servicio backend
3. Click "Environment" → "Add Environment Variable"
4. Agregar:

```
Key: YAPE_WEBHOOK_SECRET
Value: [generar con comando abajo]
```

**Generar secret seguro:**
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click "Save Changes"
6. Render redesplegará automáticamente

---

### 3. n8n Workflow 🤖

1. Abrir tu instancia n8n
2. Click "Import from File"
3. Seleccionar: `n8n-yape-verification-workflow.json`
4. Configurar variables de entorno en n8n:

```
BACKEND_URL = https://sistema-rifas-backend.onrender.com
YAPE_WEBHOOK_SECRET = [mismo value de Render]
ADMIN_WHATSAPP = 51964910248
```

5. Activar workflow (toggle ON)

---

### 4. Testing 🧪

**Prueba con Pago Real:**

1. Ir a: https://josebacilio2004.github.io/sistema_rifas/rifas.html
2. Seleccionar una rifa
3. Click "Pagar con Yape"
4. Escanear QR
5. Realizar pago de S/ 5.00
6. Esperar máximo 10 segundos
7. Verificar que aparece: "✅ Pago verificado - Operación #123456"
8. Click "Completar Compra"

---

## ⚠️ Troubleshooting

### Webhook no se recibe:

1. Verificar que n8n workflow está activo
2. Revisar logs de n8n
3. Confirmar que YAPE_WEBHOOK_SECRET coincide

### Polling no detecta verificación:

1. Abrir DevTools → Network
2. Verificar llamadas a `/api/payments/check-status`
3. Revisar logs de Render backend

### Mensaje Yape no se parsea:

1. Ver formato del mensaje en WhatsApp
2. Ajustar regex en workflow n8n si es necesario

---

## 📞 Soporte

Si necesitas ayuda, revisa los logs en:
- **Render:** Logs tab → Backend service
- **n8n:** Executions tab → Ver errores
- **Frontend:** DevTools Console

---

✅ **Una vez completados estos pasos, el sistema estará 100% funcional en producción!**
