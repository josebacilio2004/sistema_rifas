# 🎯 Crear Workflow n8n - Pasos Exactos

## Paso 1: Crear Workflow

1. En n8n Dashboard → Click **"Workflows"** (menú lateral)
2. Click **"+ Add workflow"** (arriba derecha)
3. Nombre: `Yape Payment Verification`
4. Click fuera del nombre para guardar

---

## Paso 2: Agregar Nodo Webhook (Trigger)

1. Click en el **"+"** grande en el canvas
2. Buscar: `webhook`
3. Seleccionar **"Webhook"** (el primero, con icono de gancho)

### Configurar Webhook:

- **HTTP Method**: `POST`
- **Path**: `yape-payment`
- **Response Mode**: `On Received`
- **Response Code**: `200`

4. Click **"Execute Node"** abajo
5. Verás: "Waiting for webhook call..."
6. **COPIAR LA URL** que aparece (algo como):
   ```
   https://sistema-rifas-n8n.onrender.com/webhook/yape-payment
   ```
7. Click **"Stop Listening"**

---

## Paso 3: Agregar Nodo HTTP Request

1. Click **"+"** después del webhook
2. Buscar: `http request`
3. Seleccionar **"HTTP Request"**

### Configurar HTTP Request:

- **Method**: `POST`
- **URL**: `https://sistema-rifas-backend.onrender.com/api/yape/webhook`
- **Authentication**: None
- **Send Body**: ✅ ON
- **Body Content Type**: `JSON`
- **Specify Body**: `Using JSON`

### Body (copiar exacto):

```json
{
  "secret": "26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f",
  "operation_code": "={{ $json.operation_code }}",
  "amount": "={{ $json.amount }}",
  "sender_name": "={{ $json.sender_name }}",
  "timestamp": "={{ new Date().toISOString() }}"
}
```

4. Click **"Execute Node"** para probar
5. Probablemente dará error (normal, aún no enviamos datos)

---

## Paso 4: Guardar y Activar

1. Click **"Save"** (arriba derecha)
   - Icono de diskette
2. Toggle **"Inactive"** → **"Active"**
   - Debe ponerse en azul/verde

---

## Paso 5: Probar el Workflow

### Desde PowerShell:

```powershell
$webhook = "https://sistema-rifas-n8n.onrender.com/webhook/yape-payment"

$body = @{
    operation_code = "TEST123456"
    amount = 5.00
    sender_name = "Juan Prueba"
} | ConvertTo-Json

Invoke-RestMethod -Uri $webhook -Method POST -Body $body -ContentType "application/json"
```

### Ver resultado:

1. En n8n → **"Executions"** (menú lateral)
2. Deberías ver una ejecución nueva
3. Click en ella para ver los detalles
4. Debe mostrar:
   - ✅ Webhook recibió datos
   - ✅ HTTP Request se envió al backend

---

## 🎉 ¡Listo! Workflow Funcionando

**Ahora el flujo es:**

1. Alguien (o tú) llama el webhook con datos de Yape
2. n8n recibe los datos
3. n8n llama a tu backend con el secret
4. Backend verifica el pago
5. Usuario ve confirmación en frontend

---

## 🔄 Uso Real:

Cuando usuario paga con Yape:

1. Tú recibes WhatsApp: "Recibiste S/ 5.00 - Operación #789456"

2. Abres navegador en:
   ```
   https://sistema-rifas-n8n.onrender.com/webhook/yape-payment?operation_code=789456&amount=5&sender_name=Usuario
   ```

3. n8n procesa automáticamente
4. Usuario ve "✅ Pago verificado"

---

**Sigue estos pasos EN ORDEN y me dices cuándo termines cada paso!**
