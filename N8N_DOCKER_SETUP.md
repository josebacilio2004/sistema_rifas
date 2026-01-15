# Configuración n8n Local con Docker para Yape Verification

## 🚀 Pasos Rápidos

### 1. Actualizar docker-compose.yml ✅

Ya actualicé tu `docker-compose.yml` con las variables necesarias:
- `YAPE_WEBHOOK_SECRET` en backend
- Variables para n8n (BACKEND_URL, YAPE_WEBHOOK_SECRET, ADMIN_WHATSAPP)

### 2. Reiniciar Docker

```bash
cd c:\Bacilio\Rifa

# Detener contenedores
docker-compose down

# Reconstruir y levantar
docker-compose up -d --build

# Ver logs (opcional)
docker-compose logs -f n8n
```

### 3. Acceder a n8n Local

1. Abrir navegador en: **http://localhost:5678**
2. Login con:
   - Usuario: `admin`
   - Password: `rifaadmin123`

### 4. Importar Workflow

1. En n8n, click en "**Workflows**" (menú lateral)
2. Click en "**+ Add workflow**" (arriba derecha)
3. Click en menú "**⋮**" (tres puntos)
4. Seleccionar "**Import from File**"
5. Buscar archivo: `c:\Bacilio\Rifa\n8n-yape-verification-workflow.json`
6. Click "**Open**"

### 5. Configurar Workflow (IMPORTANTE)

El workflow ya tiene las variables configuradas en docker-compose, pero necesitas ajustar algunos nodos:

#### Nodo "Call Backend Webhook":
1. Click en el nodo
2. URL debe ser: **`http://backend:3000/api/yape/webhook`**
   (usa `backend` en lugar de `localhost` porque están en la misma red Docker)
3. En Body → secret, usar: `{{$env.YAPE_WEBHOOK_SECRET}}`
4. Guardar

#### Nodo "WhatsApp Message Received":
- Configurar según tu setup de WhatsApp Business API
- Si usas WhatsApp Business API Cloud, necesitas:
  - Access Token
  - Phone Number ID
  - Verify Token

### 6. Activar Workflow

1. Click en toggle "**Inactive**" arriba
2. Debe cambiar a "**Active**" (azul/verde)

---

## 🧪 Testing Local

### Test 1: Backend Webhook

Desde PowerShell:
```powershell
curl http://localhost:3000/api/yape/test
```

Debe responder:
```json
{
  "status": "ok",
  "message": "Yape webhook endpoint is running",
  "webhook_enabled": true
}
```

### Test 2: Simular Webhook desde n8n

En n8n:
1. Click en workflow importado
2. Click "**Execute Workflow**"
3. En el nodo "Parse Yape Message", agregar test data:
```json
{
  "text": "Recibiste S/ 5.00 de Juan Pérez - Operación #123456789"
}
```
4. Ver que se ejecuta y llama al backend

---

## 📋 Estructura Docker

```
┌─────────────────┐
│   Frontend      │ (puerto 8080)
│  (GitHub Pages) │
└─────────────────┘
         ↓
┌─────────────────┐
│   Backend       │ (puerto 3000)
│   Node.js API   │ ← YAPE_WEBHOOK_SECRET
└─────────────────┘
         ↓
┌─────────────────┐
│   PostgreSQL    │ (puerto 5432)
│   Database      │
└─────────────────┘
         
┌─────────────────┐
│      n8n        │ (puerto 5678)
│   Workflows     │ ← Variables env
└─────────────────┘
         ↑
   WhatsApp API
```

---

## ⚠️ Importante

1. **Network Docker:** Todos los servicios están en `rifa-network`, usa nombres de servicio:
   - Backend: `http://backend:3000`
   - n8n: `http://n8n:5678`
   - PostgreSQL: `postgres:5432`

2. **Variables de Entorno:** Configuradas en docker-compose.yml:
   ```yaml
   BACKEND_URL=http://backend:3000
   YAPE_WEBHOOK_SECRET=26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f
   ```

3. **WhatsApp:** Necesitas configurar WhatsApp Business API para recibir mensajes

---

## 🔧 Troubleshooting

### n8n no arranca:
```bash
docker-compose logs n8n
```

### Backend no recibe webhook:
```bash
docker-compose logs backend | grep webhook
```

### Verificar conexión entre servicios:
```bash
# Entrar al contenedor n8n
docker exec -it rifa-n8n sh

# Hacer ping al backend
curl http://backend:3000/api/yape/test
```

---

✅ **Con estos pasos, tu n8n local estará configurado para verificar pagos Yape!**
