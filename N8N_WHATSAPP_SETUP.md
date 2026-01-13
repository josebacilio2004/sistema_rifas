# Configuración de n8n para Notificaciones de WhatsApp

## Paso 1: Acceder a n8n

1. Abre tu navegador y visita: **http://localhost:5678**
2. Credenciales:
   - Usuario: `admin`
   - Contraseña: `rifaadmin123`

## Paso 2: Configurar WhatsApp con Evolution API

### Opción A: Usar Evolution API (Recomendado)

Evolution API es una solución gratuita y open source para WhatsApp Business.

**Agregar Evolution API a Docker:**

```yaml
# Agregar al docker-compose.yml
evolution-api:
  image: atendai/evolution-api:latest
  container_name: evolution-api
  restart: always
  ports:
    - "8081:8081"
  environment:
    - SERVER_URL=http://localhost:8081
    - AUTHENTICATION_API_KEY=tu-clave-secreta-aqui
  networks:
    - rifa-network
```

**Pasos:**
1. Ejecutar: `docker-compose up -d evolution-api`
2. Ir a `http://localhost:8081/manager`
3. Conectar WhatsApp escaneando QR code
4. Copiar API Key y nombre de instance

### Opción B: Usar Twilio (Pago)

Si prefieres usar un servicio pago pero más estable:

1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Obtener Account SID y Auth Token
3. Comprar número de WhatsApp Business

## Paso 3: Importar Workflow en n8n

1. En n8n, click en **"+ Add workflow"**
2. Click en los tres puntos `⋮` → **"Import from File"**
3. Selecciona el archivo: `c:\Bacilio\Rifa\n8n-workflow-whatsapp.json`

## Paso 4: Configurar Nodos de WhatsApp

### Con Evolution API:

1. En el workflow, haz click en el nodo **"Send WhatsApp"**
2. Click en **"Create New Credential"**
3. Configuración:
   - **Base URL:** `http://evolution-api:8081`
   - **API Key:** Tu API Key de Evolution
   - **Instance Name:** Nombre de tu instancia

### Con Twilio:

1. Click en **"Send WhatsApp (Twilio)"**
2. Configuración:
   - **Account SID:** Tu Twilio Account SID
   - **Auth Token:** Tu Twilio Auth Token
   - **From Number:** Tu número de WhatsApp Business

## Paso 5: Activar el Webhook

1. En el nodo **"Webhook Trigger"**, copia la URL del webhook
2. Debe verse algo así: `http://localhost:5678/webhook/rifa`
3. Esta URL ya está configurada en el backend

## Paso 6: Activar el Workflow

1. En la esquina superior derecha, activa el toggle **"Active"**
2. El workflow ahora estará escuchando eventos

## Paso 7: Probar

Realiza una compra de rifa desde: http://127.0.0.1:8080

Deberías recibir un mensaje de WhatsApp como:

```
🎉 ¡Felicitaciones!

Has comprado la rifa N° 5

📝 Detalles:
- Nombre: Jose Anthony Bacilio
- Monto: S/ 5.00
- Fecha: 12/01/2026 19:15

¡Mucha suerte! 🍀
```

## Troubleshooting

**No llega el mensaje:**
1. Verifica que n8n esté activo: `docker ps | grep rifa-n8n`
2. Revisa logs del backend: `docker logs rifa-backend`
3. Revisa ejecuciones en n8n: pestaña "Executions"

**Error de conexión:**
- Asegúrate que Evolution API está corriendo
- Verifica que el número de WhatsApp esté conectado

## Número de Prueba

Para probar con el número **+51964910248**, usa este número al registrarte en el sistema.
