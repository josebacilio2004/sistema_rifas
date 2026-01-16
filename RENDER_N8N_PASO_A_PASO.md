# Deploy de n8n en Render - Guía Paso a Paso

## 📋 Antes de Empezar

**Necesitas:**
- ✅ Cuenta de GitHub (ya la tienes)
- ✅ Cuenta de Render (ya la tienes)
- ✅ Repositorio con el código (ya está pusheado)

**Tiempo estimado:** 10 minutos

---

## 🚀 Paso 1: Preparar Archivos (Ya está listo ✅)

Los archivos necesarios ya están en tu repositorio:
- `Dockerfile.n8n` ✅
- Código del sistema ✅

---

## 🌐 Paso 2: Crear Servicio en Render

### 2.1 Ir a Render Dashboard

1. Abrir navegador en: **https://dashboard.render.com/**
2. Hacer login con tu cuenta

### 2.2 Crear Nuevo Web Service

1. Click en botón **"New +"** (arriba derecha)
2. Seleccionar **"Web Service"**

### 2.3 Conectar Repositorio

1. En la lista de repositorios, buscar: **`sistema_rifas`**
2. Click en **"Connect"** al lado del repositorio

   *Si no aparece:*
   - Click en "Configure account" abajo
   - Dar acceso a tu repositorio GitHub
   - Volver y refrescar

---

## ⚙️ Paso 3: Configurar Servicio

Llenar el formulario:

### 3.1 Información Básica

```
Name: sistema-rifas-n8n
Region: Oregon (US West) o el más cercano
Branch: main
```

### 3.2 Build Settings

```
Runtime: Docker

Root Directory: (dejar vacío)

Dockerfile Path: Dockerfile.n8n
```

### 3.3 Instance Type

```
Plan: Free
```

*Nota: El plan Free tiene 750 horas/mes, suficiente para n8n*

---

## 🔐 Paso 4: Variables de Entorno

Click en **"Advanced"** → Scroll a **"Environment Variables"**

Agregar las siguientes variables una por una (Click "Add Environment Variable"):

### Variable 1:
```
Key: N8N_BASIC_AUTH_ACTIVE
Value: true
```

### Variable 2:
```
Key: N8N_BASIC_AUTH_USER
Value: admin
```

### Variable 3:
```
Key: N8N_BASIC_AUTH_PASSWORD
Value: TuPasswordSegura123!
```
*(Cambia esto por tu propia contraseña segura)*

### Variable 4:
```
Key: N8N_HOST
Value: 0.0.0.0
```

### Variable 5:
```
Key: N8N_PORT
Value: 10000
```

### Variable 6:
```
Key: N8N_PROTOCOL
Value: https
```

### Variable 7:
```
Key: WEBHOOK_URL
Value: https://sistema-rifas-n8n.onrender.com
```
*(Render asignará esta URL automáticamente, pero ponla aquí también)*

### Variable 8:
```
Key: BACKEND_URL
Value: https://sistema-rifas-backend.onrender.com
```
*(Reemplaza con tu URL real del backend)*

### Variable 9:
```
Key: YAPE_WEBHOOK_SECRET
Value: 26e235db76877dabc9923ed8bbb41f53264519380bd60ff8a86c3b3c359ee41f
```

### Variable 10:
```
Key: ADMIN_WHATSAPP
Value: 51964910248
```

---

## 🎯 Paso 5: Deploy

1. **Revisar** que todas las configuraciones estén correctas
2. Click en **"Create Web Service"** (abajo)
3. **Esperar** mientras Render:
   - Clona tu repositorio
   - Construye la imagen Docker
   - Despliega n8n
   
   *Esto toma 2-5 minutos*

4. Ver los logs en tiempo real para verificar que todo va bien

---

## ✅ Paso 6: Verificar Deployment

### 6.1 Obtener URL

Una vez completado el deploy:
- URL estará arriba: **`https://sistema-rifas-n8n.onrender.com`**
- Estado debe mostrar: **"Live"** (verde)

### 6.2 Acceder a n8n

1. Abrir en navegador: **`https://sistema-rifas-n8n.onrender.com`**
2. Aparecerá login de n8n
3. Ingresar:
   - **Username:** admin
   - **Password:** (la que configuraste)

4. Deberías ver el dashboard de n8n ✅

---

## 📥 Paso 7: Importar Workflow

### 7.1 En n8n Dashboard

1. Click en **"Workflows"** (menú lateral izquierdo)
2. Click en **"+ Add workflow"** (arriba derecha)
3. Click en menú **"⋮"** (tres puntos verticales, arriba derecha)
4. Seleccionar **"Import from File..."**

### 7.2 Seleccionar Archivo

1. Click en **"Select file to import"**
2. Navegar a: `c:\Bacilio\Rifa\n8n-yape-verification-workflow.json`
3. Click **"Open"**

### 7.3 Workflow Importado

Deberías ver todos los nodos conectados:
- WhatsApp Message Received
- Parse Yape Message
- Call Backend Webhook
- Webhook Success?
- Notify Admin Success/Error

---

## 🔧 Paso 8: Configurar Nodos del Workflow

### 8.1 Nodo "Call Backend Webhook"

1. Click en el nodo **"Call Backend Webhook"**
2. En **URL**, poner:
   ```
   https://sistema-rifas-backend.onrender.com/api/yape/webhook
   ```
   *(Reemplaza con tu URL real del backend)*

3. En **Body Parameters** → **secret**, verificar que diga:
   ```
   {{$env.YAPE_WEBHOOK_SECRET}}
   ```

4. Click **"Save"** (abajo derecha del nodo)

### 8.2 Nodo "WhatsApp Message Received"

Este nodo necesita configuración de WhatsApp Business API:
1. Click en el nodo
2. Seleccionar credenciales de WhatsApp
3. Si no las tienes configuradas, ve al Paso 9

---

## 📱 Paso 9: Conectar WhatsApp Business API (Opcional pero necesario)

### Opción A: WhatsApp Business Cloud API (Meta)

1. Ir a: https://developers.facebook.com/
2. Crear app de WhatsApp Business
3. Obtener:
   - Phone Number ID
   - Access Token
   - Webhook Verify Token

4. En n8n → Credentials → Add WhatsApp credentials
5. Pegar tokens

### Opción B: Twilio WhatsApp Sandbox (Para Testing)

1. Ir a: https://console.twilio.com/
2. Messaging → Try it out → Send a WhatsApp message
3. Obtener:
   - Account SID
   - Auth Token
   - From Number

4. Configurar en n8n credentials

**Por ahora puedes saltar este paso si quieres hacer pruebas internas primero**

---

## ⚡ Paso 10: Activar Workflow

1. Asegurarte de que todos los nodos estén configurados
2. Click en **"Save"** (arriba derecha)
3. Click en toggle **"Inactive"** (arriba derecha)
4. Debe cambiar a **"Active"** (verde/azul)

---

## 🧪 Paso 11: Testing

### Test 1: Verificar que n8n esté accesible

```bash
# Desde PowerShell
curl https://sistema-rifas-n8n.onrender.com
```

Debe responder (aunque sea con error 401 por auth, es buena señal)

### Test 2: Verificar webhook del backend

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

### Test 3: Ejecutar workflow manualmente

1. En n8n, en tu workflow
2. Click "Execute Workflow"
3. Ver que se ejecuta sin errores

---

## 📊 Paso 12: Monitoreo

### Ver Logs en Render

1. En Render Dashboard → Servicio n8n
2. Tab **"Logs"**
3. Ver que n8n esté corriendo:
   ```
   Editor is now accessible via:
   https://sistema-rifas-n8n.onrender.com/
   ```

### Ver Ejecuciones en n8n

1. En n8n → **"Executions"**
2. Ver historial de ejecuciones
3. Debuggear si hay errores

---

## ⚠️ Troubleshooting

### n8n no se despliega

- **Error:** "Docker build failed"
  - **Solución:** Verificar que `Dockerfile.n8n` exista en la raíz
  
- **Error:** "Port already in use"
  - **Solución:** Cambiar `N8N_PORT` a otro puerto

### No puedo acceder a n8n

- **Error:** 401 Unauthorized
  - **Solución:** Verificar usuario/password en variables de entorno

- **Error:** 502 Bad Gateway
  - **Solución:** n8n está iniciando, esperar 1-2 minutos

### Workflow no se ejecuta

- **Error:** "Webhook timeout"
  - **Solución:** Verificar BACKEND_URL en variables
  
- **Error:** "WhatsApp credentials missing"
  - **Solución:** Configurar WhatsApp API (Paso 9)

---

## ✅ Checklist Final

- [ ] n8n accesible en `https://sistema-rifas-n8n.onrender.com`
- [ ] Login funciona con admin/password
- [ ] Workflow importado
- [ ] Nodos configurados con URLs correctas
- [ ] Variables de entorno configuradas
- [ ] Workflow activo (toggle verde)
- [ ] Backend responde en `/api/yape/test`

---

## 🎉 ¡Listo!

Tu n8n está deployado y funcionando 24/7 **gratis** en Render.

**Próximos pasos:**
1. Configurar WhatsApp Business API
2. Hacer prueba con pago real
3. Monitorear ejecuciones

**URLs Importantes:**
- n8n: `https://sistema-rifas-n8n.onrender.com`
- Backend: `https://sistema-rifas-backend.onrender.com`
- Frontend: `https://josebacilio2004.github.io/sistema_rifas/`

---

¿Problemas? Revisa los logs en Render o ejecuta el workflow manualmente en n8n para debuggear.
