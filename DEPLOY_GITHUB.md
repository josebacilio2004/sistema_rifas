# 🚀 Guía de Despliegue a GitHub Pages

Esta guía te ayudará a desplegar el frontend a GitHub Pages.

## 📝 Pasos para Subir a GitHub

### 1. Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Click en "New repository"
3. Nombre: `Rifa` (o el que prefieras)
4. Descripción: "Sistema de rifas online"
5. **Importante**: Marca como **Público**
6. Click en "Create repository"

### 2. Subir el Código

Desde PowerShell en `c:\Bacilio\Rifa`:

```powershell
# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .

# Hacer commit
git commit -m "Sistema de rifas completo"

# Conectar con GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/Rifa.git

# Subir el código
git branch -M main
git push -u origin main
```

### 3. Configurar GitHub Pages

1. En tu repositorio de GitHub, ve a **Settings**
2. En el menú lateral, click en **Pages**
3. En "Source", selecciona:
   - Branch: `main`
   - Folder: `/frontend` (o `/root` y luego mover los archivos de frontend a la raíz)
4. Click en **Save**
5. Espera 1-2 minutos

Tu frontend estará en: `https://TU_USUARIO.github.io/Rifa/`

## ⚙️ Configuración Importante

### Actualizar la URL del API

Antes de subir a GitHub, **DEBES** actualizar la configuración del frontend:

**Archivo: `frontend/js/config.js`**

```javascript
// Configuration for the frontend application
const CONFIG = {
    // API Base URL - ACTUALIZA ESTA URL
    API_URL: 'https://tu-backend.onrender.com/api',  // ⬅️ CAMBIAR AQUÍ
    
    // Polling interval
    POLL_INTERVAL: 10000,
    
    // Reservation timeout
    RESERVATION_TIMEOUT: 5,
    
    // Yape info
    YAPE: {
        phone: '+51987654321',
        name: 'Sistema de Rifas'
    }
};
```

### Opción Dinámica (Recomendada)

Mejor aún, usa esta configuración que detecta automáticamente:

```javascript
const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://tu-backend.onrender.com/api',  // ⬅️ URL de producción
    
    POLL_INTERVAL: 10000,
    RESERVATION_TIMEOUT: 5,
    YAPE: {
        phone: '+51987654321',
        name: 'Sistema de Rifas'
    }
};
```

## 🔄 Flujo Completo de Despliegue

### 1. Backend en Render

Primero despliega el backend:

```bash
# Ya tienes el código en GitHub
# En Render.com:
# 1. New → Web Service
# 2. Connect GitHub repository
# 3. Settings:
#    - Build Command: cd backend && npm install
#    - Start Command: cd backend && npm start
# 4. Add environment variables (ver .env.example)
# 5. Create Database PostgreSQL
# 6. Deploy!
```

URL resultante: `https://tu-app.onrender.com`

### 2. Base de Datos en Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a SQL Editor
3. Copiar y ejecutar `backend/schema.sql`
4. Copiar Connection String
5. Agregar como variable `DATABASE_URL` en Render

### 3. Frontend en GitHub Pages

1. Actualizar `frontend/js/config.js` con URL de Render
2. Git commit y push
3. Configurar GitHub Pages
4. ¡Listo!

## 🧪 Probar el Deploy

Una vez desplegado:

1. Abre `https://TU_USUARIO.github.io/Rifa/`
2. Registra un usuario
3. Selecciona una rifa
4. Verifica que el QR de Yape funcione

## ❗ Problemas Comunes

### "Failed to fetch" o CORS Error

**Solución:** Asegúrate de actualizar `FRONTEND_URL` en Render con:
```
https://TU_USUARIO.github.io
```

### GitHub Pages muestra 404

**Solución:** 
- Verifica que los archivos estén en la carpeta correcta
- Espera 2-3 minutos después de configurar Pages
- Verifica que el repositorio sea público

### El backend no responde

**Solución:**
- Render free tier se duerme tras 15 min de inactividad
- La primera request puede tardar 30-60 segundos
- Usar servicio como [cron-job.org](https://cron-job.org) para hacer ping cada 10 min

## 📁 Estructura para GitHub

Opción 1: Mantener estructura actual
```
Rifa/
├── backend/
├── frontend/     ← GitHub Pages apunta aquí
├── README.md
└── ...
```

Opción 2: Mover frontend a raíz (más simple)
```
Rifa/
├── index.html
├── css/
├── js/
├── backend/
└── README.md
```

## 🔒 Seguridad

Antes de subir a GitHub:

1. ✅ Verifica que `.gitignore` incluye:
   ```
   .env
   node_modules/
   ```

2. ✅ NUNCA subas:
   - Credenciales de base de datos
   - API keys privadas
   - Archivos `.env`

## 📱 URLs Finales

Después del despliegue tendrás:

- **Frontend**: `https://TU_USUARIO.github.io/Rifa/`
- **Backend**: `https://tu-app.onrender.com`
- **Database**: Supabase (connection string)
- **n8n**: `https://tu-n8n.com` (opcional)

## 💡 Consejo

Para desarrollo local y producción, usa este patrón en `config.js`:

```javascript
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const CONFIG = {
    API_URL: isDevelopment 
        ? 'http://localhost:3000/api'
        : 'https://rifa-backend.onrender.com/api'
};
```

---

¿Necesitas ayuda con algún paso específico del despliegue?
