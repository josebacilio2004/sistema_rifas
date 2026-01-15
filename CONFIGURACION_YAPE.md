# Configuración YAPE_WEBHOOK_SECRET y n8n Workflow

## 🔑 Paso 1: Configurar YAPE_WEBHOOK_SECRET en Render

### Tu Secret Generado:
```
YAPE_WEBHOOK_SECRET=26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f
```

### Instrucciones Render:

1. **Ir a Render Dashboard:**
   - URL: https://dashboard.render.com/
   - Login con tu cuenta

2. **Seleccionar tu servicio backend:**
   - Click en el servicio "sistema-rifas-backend" (o el nombre que le pusiste)

3. **Agregar Variable de Entorno:**
   - Click en "Environment" en el menú lateral izquierdo
   - Scroll hasta "Environment Variables"
   - Click en "Add Environment Variable"

4. **Llenar los campos:**
   ```
   Key: YAPE_WEBHOOK_SECRET
   Value: 26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f
   ```

5. **Guardar:**
   - Click "Save Changes"
   - Render redesplegará automáticamente (tarda ~2 minutos)

---

## 🤖 Paso 2: Importar Workflow en n8n

### Encontrar el archivo:
El workflow está en: `c:\Bacilio\Rifa\n8n-yape-verification-workflow.json`

### Instrucciones n8n:

1. **Abrir tu instancia n8n:**
   - Si usas n8n.cloud: https://app.n8n.cloud/ (o tu URL)
   - Si usas n8n local: http://localhost:5678/

2. **Ir a la página de Workflows:**
   - Click en "Workflows" en menú lateral

3. **Importar workflow:**
   - Click en botón "..." (tres puntos) arriba a la derecha
   - Seleccionar "Import from File"
   - O simplemente hacer click en "+ Add workflow" → "Import from file"

4. **Seleccionar archivo:**
   - Buscar: `n8n-yape-verification-workflow.json`
   - Click "Open"

5. **Configurar Variables de Entorno en n8n:**
   
   Una vez importado, necesitas configurar 3 variables:
   
   **Opción A: Variables de entorno (recomendado)**
   - Settings → Variables → Add Variable
   - Agregar:
   ```
   BACKEND_URL = https://sistema-rifas-backend.onrender.com
   YAPE_WEBHOOK_SECRET = 26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f
   ADMIN_WHATSAPP = 51964910248
   ```

   **Opción B: Editar en cada nodo**
   - Abrir nodo "Call Backend Webhook"
   - En el campo URL: poner tu URL de Render
   - En Body → secret: poner tu YAPE_WEBHOOK_SECRET
   - Guardar

6. **Activar Workflow:**
   - Toggle "Active" arriba a la derecha
   - Debe quedar en azul (ON)

7. **Verificar:**
   - El workflow debe empezar a escuchar mensajes de WhatsApp
   - Cuando llegue un mensaje de pago Yape, lo procesará automáticamente

---

## 🧪 Verificar que funciona:

1. **Test del Webhook Backend:**
   ```bash
   curl https://sistema-rifas-backend.onrender.com/api/yape/test
   ```
   Debe responder:
   ```json
   {
     "status": "ok",
     "message": "Yape webhook endpoint is running",
     "webhook_enabled": true
   }
   ```

2. **Test Manual del Workflow n8n:**
   - En n8n, click en "Execute Workflow"
   - Simular un mensaje de Yape
   - Ver que se ejecuta correctamente

---

## 📝 Notas Importantes:

- ✅ **Mismo Secret:** Usa el MISMO valor en Render y n8n
- ✅ **URL Correcta:** Verifica que BACKEND_URL sea tu URL de Render
- ✅ **WhatsApp Conectado:** n8n debe tener acceso a WhatsApp Business API
- ⚠️ **No compartas el secret:** Es como una contraseña

---

¿Necesitas ayuda con algún paso específico?
