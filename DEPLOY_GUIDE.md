# 🚀 Guía de Despliegue - GitHub Pages + Render

## ✅ Código Ya Subido a GitHub

Tu repositorio: https://github.com/josebacilio2004/sistema_rifas

---

## 📱 Paso 1: Configurar GitHub Pages (Frontend)

### 1.1 Ir a Configuración del Repositorio

1. Ve a: https://github.com/josebacilio2004/sistema_rifas
2. Click en **"Settings"** (arriba a la derecha)

### 1.2 Habilitar GitHub Pages

1. En el menú lateral izquierdo, click en **"Pages"**
2. En **"Source"**, selecciona:
   - Branch: **main**
   - Folder: **/docs**
3. Click **"Save"**

### 1.3 Esperar Despliegue

- GitHub tarda ~2-3 minutos en desplegar
- Refrescar la página para ver el link
- Tu frontend estará en: **https://josebacilio2004.github.io/sistema_rifas/**

### 1.4 Actualizar Configuración del Frontend

**Archivo:** `docs/js/config.js`

Cambiar:
```javascript
const API_URL = 'http://localhost:3000';
```

Por:
```javascript
const API_URL = 'https://tu-backend-render.onrender.com';
```

(Lo actualizaremos después de crear el backend en Render)

---

## 🖥️ Paso 2: Desplegar Backend en Render

### 2.1 Crear Cuenta en Render

1. Ve a: https://render.com
2. Click **"Get Started"**
3. Regístrate con GitHub

### 2.2 Conectar Repositorio

1. Dashboard de Render → **"New +"**
2. Selecciona **"Web Service"**
3. Click **"Connect a repository"**
4. Busca y selecciona: **josebacilio2004/sistema_rifas**
5. Click **"Connect"**

### 2.3 Configurar el Servicio

| Campo | Valor |
|-------|-------|
| **Name** | `sistema-rifas-backend` |
| **Region** | (El más cercano - US East) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### 2.4 Agregar Variables de Entorno

Click en **"Advanced" → "Add Environment Variable"**

Agregar estas variables:

```
NODE_ENV=production
PORT=3000

# Base de datos (Render te la dará)
DATABASE_URL=(lo agregaremos después)

# Frontend (actualizar después de GitHub Pages)
FRONTEND_URL=https://josebacilio2004.github.io/sistema_rifas

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=1029454266914004
WHATSAPP_ACCESS_TOKEN=tu_token_de_60_dias
WHATSAPP_BUSINESS_ACCOUNT_ID=2328273194341559
WHATSAPP_ADMIN_NUMBER=+51964910248

# Yape
YAPE_PHONE=+51987654321
YAPE_NAME=Sistema de Rifas
```

### 2.5 Click **"Create Web Service"**

Render empezará a desplegar automáticamente.

---

## 🗄️ Paso 3: Crear Base de Datos PostgreSQL en Render

### 3.1 Crear PostgreSQL

1. Dashboard de Render → **"New +"**
2. Selecciona **"PostgreSQL"**
3. Configurar:
   - **Name:** `sistema-rifas-db`
   - **Database:** `rifa_db`
   - **User:** `rifauser`
   - **Region:** (Mismo que el backend)
   - **PostgreSQL Version:** `16`
   - **Plan:** **Free**

4. Click **"Create Database"**

### 3.2 Copiar Connection String

1. Una vez creada, ve a la página de la base de datos
2. Copia el **"Internal Database URL"** (empieza con `postgres://`)
3. Ejemplo: `postgres://rifauser:password@dpg-xxx.oregon-postgres.render.com/rifa_db`

### 3.3 Actualizar Backend con DATABASE_URL

1. Ve a tu servicio backend en Render
2. Click en **"Environment"**
3. Editar la variable `DATABASE_URL`
4. Pegar el connection string copiado
5. Click **"Save Changes"**

El backend se redesplegará automáticamente.

---

## 🔄 Paso 4: Actualizar Frontend con URL del Backend

### 4.1 Obtener URL del Backend

1. En Render, ve a tu servicio backend
2. Copia la URL (arriba a la izquierda)
3. Ejemplo: `https://sistema-rifas-backend.onrender.com`

### 4.2 Actualizar config.js

**Archivo:** `frontend/js/config.js`

```javascript
const CONFIG = {
    API_URL: 'https://sistema-rifas-backend.onrender.com',
    RESERVATION_TIMEOUT: 5
};
```

### 4.3 Commit y Push

```bash
git add frontend/js/config.js
git commit -m "Update API URL for production"
git push
```

GitHub Pages se actualizará automáticamente en ~2 minutos.

---

## ✅ Paso 5: Verificar que Todo Funciona

### 5.1 Probar Frontend

1. Ve a: `https://josebacilio2004.github.io/sistema_rifas/`
2. Deberías ver la interfaz de rifas
3. Presiona **F12** (consola del navegador)
4. No deberías ver errores de CORS

### 5.2 Probar Registro

1. Haz clic en "Registrarse"
2. Completa el formulario
3. Deberías poder registrarte exitosamente

### 5.3 Probar Compra

1. Selecciona una rifa
2. Agrega al carrito
3. Compra
4. Deberías recibir las notificaciones de WhatsApp (si todo está configurado)

---

## 🔧 Paso 6: Configuración Adicional

### 6.1 CORS

El backend ya tiene CORS configurado, pero verifica en `backend/server.js` que incluya tu dominio de GitHub Pages:

```javascript
const allowedOrigins = [
    'http://localhost:8080',
    'https://josebacilio2004.github.io'
];
```

### 6.2 WhatsApp Token Permanente

Tu token temporal expira cada 60 minutos. Para producción:

1. Meta Developers → Business Settings
2. System Users → Create
3. Generate token con permisos WhatsApp
4. Actualizar `WHATSAPP_ACCESS_TOKEN` en Render

---

## 📊 Resumen de URLs

| Servicio | URL |
|----------|-----|
| **GitHub Repo** | https://github.com/josebacilio2004/sistema_rifas |
| **Frontend (GitHub Pages)** | https://josebacilio2004.github.io/sistema_rifas/ |
| **Backend (Render)** | https://sistema-rifas-backend.onrender.com |
| **Base de Datos (Render)** | (Internal URL en Render) |

---

## ⚠️ Notas Importantes

### Limitaciones del Plan Free de Render

- **Backend se "duerme"** después de 15 minutos de inactividad
- Primera petición después de dormirse tarda ~30 segundos
- Máximo 750 horas/mes de uptime
- Base de datos expira después de 90 días

### Solución: Mantener Backend Activo

Crear un cron job que haga ping cada 10 minutos:

**Archivo:** `backend/keep-alive.js`

```javascript
setInterval(async () => {
    try {
        await fetch('https://sistema-rifas-backend.onrender.com/api/raffles');
        console.log('Keep-alive ping sent');
    } catch (error) {
        console.error('Keep-alive failed:', error.message);
    }
}, 10 * 60 * 1000); // 10 minutos
```

---

## 🎉 ¡Despliegue Completado!

Una vez configurado todo:

1. ✅ Frontend en GitHub Pages
2. ✅ Backend en Render
3. ✅ Base de datos PostgreSQL en Render
4. ✅ WhatsApp funcionando
5. ✅ Sistema completamente funcional

**¿Necesitas ayuda con algún paso específico?** ¡Avísame!
