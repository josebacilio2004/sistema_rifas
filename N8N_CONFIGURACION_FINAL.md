# 🚀 Configuración Final n8n - WhatsApp Automatizado

## ✅ Credenciales Confirmadas

```yaml
APP_ID: 1252880746905000
APP_SECRET: 997f48678fc2d8bdf8e7f400690c2e6c
ACCESS_TOKEN: EAARzfQfdfagBQaBUtX5hpu6mXh6sfevxIVCo7vUrEIvGraZA9nvgqAOnNtCe4Pxx8W2n0oRvvJq1EvPZCbKwPvZBbBqqsz0wPiGfSPQGbXTaI9humhwGzz3iCTvsnEso8ZBrgbTQChbC74S9XdRZB9RZCnhZAkwMhgXGDaFHSTrXyTX1vYVHFyh2Ta8DuWkneCyT6sMlHRtUxrM7ZAAyWU7owhfkXWDoeZCDMSsJm
WABA_ID: 2328273194341559
PHONE_NUMBER_ID: 1029454266914004
FROM_PHONE: +15551409612 (número de prueba)
TO_PHONE: +51964910248
```

---

## 📱 Paso 1: Configurar Credenciales en n8n

### 1.1 Acceder a n8n
- URL: https://sistema-rifas-n8n.onrender.com
- Login con las credenciales que creaste en el setup

### 1.2 Crear Credencial WhatsApp

1. En n8n Dashboard → Click **"Credentials"** (menú lateral)
2. Click **"+ Add Credential"**
3. Buscar y seleccionar **"WhatsApp Business Cloud API"**
4. Llenar:

```yaml
Credential Name: WhatsApp Rifas
Access Token: EAARzfQfdfagBQaBUtX5hpu6mXh6sfevxIVCo7vUrEIvGraZA9nvgqAOnNtCe4Pxx8W2n0oRvvJq1EvPZCbKwPvZBbBqqsz0wPiGfSPQGbXTaI9humhwGzz3iCTvsnEso8ZBrgbTQChbC74S9XdRZB9RZCnhZAkwMhgXGDaFHSTrXyTX1vYVHFyh2Ta8DuWkneCyT6sMlHRtUxrM7ZAAyWU7owhfkXWDoeZCDMSsJm
```

5. Click **"Save"**

---

## 🔧 Paso 2: Crear Workflow Simplificado

### 2.1 Crear Nuevo Workflow

1. Click **"Workflows"** → **"+ Add workflow"**
2. Nombre: **Yape Payment Verification**

### 2.2 Agregar Nodos

#### Nodo 1: Webhook Trigger

1. Click **"+"** → Buscar **"Webhook"**
2. Configurar:
   - **Webhook URLs**: `Production URL`
   - **HTTP Method**: POST
   - **Path**: `yape-payment`
   
3. Copiar la Webhook URL (algo como):
   ```
   https://sistema-rifas-n8n.onrender.com/webhook/yape-payment
   ```

#### Nodo 2: Function - Parse Yape Data

1. Agregar nodo **"Code"** o **"Function"**
2. Código:

```javascript
// Recibir datos del webhook
const operationCode = $input.item.json.operation_code;
const amount = $input.item.json.amount;
const senderName = $input.item.json.sender_name;

// Validar
if (!operationCode || !amount) {
  throw new Error('Datos incompletos');
}

return {
  json: {
    operation_code: operationCode,
    amount: parseFloat(amount),
    sender_name: senderName || 'Desconocido',
    timestamp: new Date().toISOString()
  }
};
```

#### Nodo 3: HTTP Request - Call Backend

1. Agregar nodo **"HTTP Request"**
2. Configurar:
   - **Method**: POST
   - **URL**: `https://sistema-rifas-backend.onrender.com/api/yape/webhook`
   - **Body Content Type**: JSON
   - **Specify Body**: JSON
   - **JSON Body**:
   ```json
   {
     "secret": "26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f",
     "operation_code": "={{ $json.operation_code }}",
     "amount": "={{ $json.amount }}",
     "sender_name": "={{ $json.sender_name }}",
     "timestamp": "={{ $json.timestamp }}"
   }
   ```

#### Nodo 4: IF - Check Success

1. Agregar **"IF"** node
2. Condición:
   - **Value 1**: `={{ $json.success }}`
   - **Operation**: Equal
   - **Value 2**: `true`

### 2.3 Activar Workflow

1. Click **"Save"** (arriba derecha)
2. Toggle **"Active"** (debe ponerse verde/azul)

---

## 🧪 Paso 3: Testing Manual

### Opción A: Test con Webhook URL

Abre PowerShell y ejecuta:

```powershell
$body = @{
    operation_code = "TEST123456"
    amount = 5.00
    sender_name = "Juan Test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://sistema-rifas-n8n.onrender.com/webhook/yape-payment" -Method POST -Body $body -ContentType "application/json"
```

Deberías ver en n8n → Executions que el workflow se ejecutó.

### Opción B: Test desde n8n

1. En el workflow, click **"Execute Workflow"**
2. Click en nodo Webhook → **"Listen for Test Event"**
3. Ejecutar el PowerShell de arriba
4. Ver que funciona

---

## 📞 Paso 4: Usar WhatsApp (Modo Manual Mejorado)

**Flujo Actual:**

1. Usuario paga con Yape → Tú recibes WhatsApp
2. **Opción A:** Mensaje de Yape dice:
   ```
   Recibiste S/ 5.00 de Juan Pérez
   Operación #123456789
   ```
   
3. **TÚ** llamas tu webhook manualmente:
   - Abre navegador
   - URL: `https://sistema-rifas-n8n.onrender.com/webhook/yape-payment?operation_code=123456789&amount=5&sender_name=JuanPerez`
   - O usa PowerShell con los datos reales

4. n8n procesa → Backend verifica → Usuario ve confirmación

---

## 🎯 Siguiente Nivel: WhatsApp Automático (Opcional)

Para que WhatsApp envíe mensajes directamente a n8n:

### Configurar Webhook en Facebook

1. Facebook Developers → Tu App → WhatsApp → Configuration
2. **Webhook**:
   - Callback URL: `https://sistema-rifas-n8n.onrender.com/webhook/whatsapp`
   - Verify Token: `RifaSecure2026` (inventa uno)
3. Subscribe to: **messages**

### Actualizar Workflow

Cambiar nodo 1 de Webhook a **WhatsApp Trigger**:
1. Credential: WhatsApp Rifas
2. Agregar nodo **"Code"** para parsear mensaje:

```javascript
const message = $input.item.json.entry[0].changes[0].value.messages[0].text.body;

// Regex para Yape
const match = message.match(/Recibiste\s+S\/\s*([\d.]+).*Operación\s*#(\d+)/i);

if (!match) {
  return { json: { skip: true } };
}

return {
  json: {
    operation_code: match[2],
    amount: parseFloat(match[1]),
    sender_name: 'WhatsApp Auto'
  }
};
```

---

## ✅ Estado Actual

**FUNCIONANDO:**
- ✅ Backend con webhook endpoint
- ✅ n8n deployado
- ✅ WhatsApp Business configurado
- ✅ Credenciales correctas

**PARA EMPEZAR HOY:**
- ✅ Usa webhook manual (Paso 4)
- ✅ Flujo semi-automatizado

**PARA FULL AUTO (opcional):**
- Configure webhook WhatsApp
- Test con mensaje real

---

## 📝 Resumen de URLs

```
n8n: https://sistema-rifas-n8n.onrender.com
Webhook: https://sistema-rifas-n8n.onrender.com/webhook/yape-payment
Backend: https://sistema-rifas-backend.onrender.com
Frontend: https://josebacilio2004.github.io/sistema_rifas/
```

---

**🚀 Configura el workflow en n8n ahora y probamos!**
