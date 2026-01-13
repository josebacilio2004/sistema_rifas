# 🚀 Guía Completa: Neon + Render - Paso a Paso

## 📊 Parte 1: Crear Base de Datos en Neon (5 minutos)

### Paso 1: Crear Cuenta en Neon

1. **Abrir navegador** e ir a: **https://neon.tech**

2. **Click en "Sign up"** (botón arriba a la derecha)

3. **Seleccionar "Continue with GitHub"**
   - Esto es más rápido y no requiere verificación de email

4. **Autorizar Neon** en GitHub
   - Click "Authorize Neon"

5. **¡Listo!** Estás dentro del dashboard de Neon

---

### Paso 2: Crear Proyecto (Base de Datos)

1. **Click en "Create a project"** (botón grande en el centro)

2. **Configurar el proyecto:**
   ```
   Project name: sistema-rifas
   Database name: rifa_db
   PostgreSQL version: 16 (default)
   Region: US East (Ohio) - us-east-2
   ```

3. **Click en "Create project"**

4. **Esperar 10-15 segundos** mientras se crea

---

### Paso 3: Copiar Connection String

**Una vez creado, verás una pantalla con el connection string:**

```
Connection string copied to clipboard ✓

postgresql://neondb_owner:npg_AbCd1234XyZ@ep-cool-sound-123456.us-east-2.aws.neon.tech/rifa_db?sslmode=require
```

**IMPORTANTE:** 
- ✅ **Copia este string completo** - lo necesitarás en Render
- ✅ Guárdalo en un lugar seguro (Notepad)

**Ejemplo de connection string:**
```
postgresql://neondb_owner:npg_kLmN5678PqR@ep-divine-tree-987654.us-east-2.aws.neon.tech/rifa_db?sslmode=require
```

---

### Paso 4: Crear las Tablas (Schema)

1. **En Neon, click en "SQL Editor"** (menú lateral izquierdo)

2. **Verás un editor de código SQL**

3. **Copia el contenido del archivo `backend/schema.sql`** de tu proyecto

4. **Pega todo el SQL en el editor de Neon**

5. **Click en "Run"** (botón azul arriba a la derecha)

6. **Verás mensaje: "Success - Command completed"**

7. **Verificar tablas creadas:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

   Deberías ver:
   - `users`
   - `raffles`
   - `transactions`

---

## 🖥️ Parte 2: Desplegar Backend en Render (10 minutos)

### Paso 1: Crear Cuenta en Render

1. **Ir a:** **https://render.com**

2. **Click en "Get Started"**

3. **Seleccionar "Sign up with GitHub"**

4. **Autorizar Render** en GitHub

---

### Paso 2: Crear Web Service

1. **En el Dashboard de Render, click en "New +"** (arriba a la derecha)

2. **Seleccionar "Web Service"**

3. **Click en "Connect a repository"**

4. **Buscar tu repositorio:** `josebacilio2004/sistema_rifas`
   - Si no aparece, click "Configure account" y dar permiso

5. **Click en "Connect"** al lado del repositorio

---

### Paso 3: Configurar el Servicio

**Completar el formulario:**

| Campo | Valor |
|-------|-------|
| **Name** | `sistema-rifas-backend` |
| **Region** | `Ohio (US East)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

**Scroll hacia abajo**

**Instance Type:** Seleccionar **"Free"**

---

### Paso 4: Agregar Variables de Entorno

**Click en "Advanced" (expandir sección)**

**Click en "Add Environment Variable"**

**Agregar estas variables UNA POR UNA:**

```env
NODE_ENV=production

PORT=3000

DATABASE_URL=postgresql://neondb_owner:tu_password@ep-xxx.us-east-2.aws.neon.tech/rifa_db?sslmode=require

FRONTEND_URL=https://josebacilio2004.github.io/sistema_rifas

WHATSAPP_PHONE_NUMBER_ID=1029454266914004

WHATSAPP_ACCESS_TOKEN=EAAMmMDAeADgBQ...

WHATSAPP_BUSINESS_ACCOUNT_ID=2328273194341559

WHATSAPP_ADMIN_NUMBER=+51964910248

YAPE_PHONE=+51987654321

YAPE_NAME=Sistema de Rifas
```

**IMPORTANTE:**
- En `DATABASE_URL`: Pegar el connection string que copiaste de Neon
- En `WHATSAPP_ACCESS_TOKEN`: Generar un token de 60 días en Meta Developers

---

### Paso 5: Crear el Servicio

1. **Click en "Create Web Service"** (botón azul abajo)

2. **Esperar 2-5 minutos** mientras Render:
   - Clona el repositorio
   - Instala dependencias (`npm install`)
   - Inicia el servidor

3. **Ver logs en tiempo real:**
   - Verás el progreso en la pantalla
   - Busca líneas como:
     ```
     ✅ Database connected successfully
     🚀 Server running on port 3000
     ```

4. **Una vez completado, verás:**
   ```
   Your service is live 🎉
   https://sistema-rifas-backend.onrender.com
   ```

---

### Paso 6: Copiar URL del Backend

**En la parte superior de la página de tu servicio:**

```
https://sistema-rifas-backend.onrender.com
```

**Copia esta URL** - la necesitarás para el frontend.

---

## 🌐 Parte 3: Configurar GitHub Pages (5 minutos)

### Paso 1: Activar GitHub Pages

1. **Ir a:** https://github.com/josebacilio2004/sistema_rifas/settings/pages

2. **En "Source":**
   - Branch: **main**
   - Folder: **/docs**

3. **Click "Save"**

4. **Esperar 2-3 minutos**

5. **Refrescar la página** - verás:
   ```
   Your site is live at https://josebacilio2004.github.io/sistema_rifas/
   ```

---

### Paso 2: Actualizar config.js con URL del Backend

**En tu computadora:**

1. **Abrir:** `docs/js/config.js`

2. **Cambiar:**
   ```javascript
   const CONFIG = {
       API_URL: 'http://localhost:3000',
       RESERVATION_TIMEOUT: 5
   };
   ```

   **Por:**
   ```javascript
   const CONFIG = {
       API_URL: 'https://sistema-rifas-backend.onrender.com',
       RESERVATION_TIMEOUT: 5
   };
   ```

3. **Guardar el archivo**

---

### Paso 3: Subir Cambios a GitHub

```bash
git add docs/js/config.js
git commit -m "Update backend URL for production"
git push
```

**GitHub Pages se actualizará automáticamente en 1-2 minutos**

---

## ✅ Parte 4: Verificar que Todo Funciona

### Test 1: Backend Funcionando

1. **Abrir en navegador:**
   ```
   https://sistema-rifas-backend.onrender.com/api/raffles
   ```

2. **Deberías ver un JSON con 100 rifas:**
   ```json
   [
     {
       "id": 1,
       "status": "available",
       "reserved_by": null,
       ...
     },
     ...
   ]
   ```

---

### Test 2: Frontend Conectado

1. **Ir a:** https://josebacilio2004.github.io/sistema_rifas/

2. **Presionar F12** (abrir consola del navegador)

3. **Ir a pestaña "Console"**

4. **NO deberías ver errores de CORS**

5. **Deberías ver las 100 rifas cargándose**

---

### Test 3: Registro Funciona

1. **Click en "Registrarse"**

2. **Completar formulario:**
   - Nombre: Test
   - Apellido: Usuario
   - DNI: 11223344
   - Celular: +51999888777

3. **Click "Registrarse"**

4. **Deberías ver mensaje:** "Registro exitoso"

5. **Verificar en Neon:**
   - Ir a SQL Editor
   - Ejecutar: `SELECT * FROM users;`
   - Deberías ver tu usuario registrado

---

### Test 4: Compra Funciona

1. **Seleccionar una rifa verde**

2. **Click en el número**

3. **Click en el carrito** 🛒

4. **Click "Comprar Rifas"**

5. **Aparece modal con QR de Yape**

6. **Click "He completado el pago"**

7. **Verificar en Neon:**
   ```sql
   SELECT * FROM raffles WHERE status = 'sold';
   SELECT * FROM transactions;
   ```

8. **Si WhatsApp está configurado:**
   - Deberías recibir notificación en +51964910248

---

## 🎯 Resumen de URLs

| Servicio | URL |
|----------|-----|
| **GitHub Repo** | https://github.com/josebacilio2004/sistema_rifas |
| **Frontend** | https://josebacilio2004.github.io/sistema_rifas/ |
| **Backend** | https://sistema-rifas-backend.onrender.com |
| **Base de Datos** | Neon Dashboard: https://console.neon.tech |

---

## ⚠️ Notas Importantes

### 1. Render Free Tier

- Backend se "duerme" después de 15 minutos de inactividad
- Primera petición tarda ~30 segundos en despertar
- Máximo 750 horas/mes de uptime

### 2. Neon Free Tier

- 0.5 GB de almacenamiento
- Base de datos se suspende después de 5 min de inactividad
- Se reactiva automáticamente en ~1 segundo

### 3. WhatsApp Token

- Token temporal expira cada 60 minutos
- Para producción, genera token de 60 días en Meta Developers

---

## 🐛 Solución de Problemas

### Backend no inicia

**Revisar logs en Render:**
1. Dashboard → Tu servicio
2. Click en "Logs"
3. Buscar errores

**Errores comunes:**
- `DATABASE_URL` mal configurado → Verificar connection string de Neon
- `Module not found` → Verificar que `Root Directory = backend`

### Frontend muestra error CORS

**Verificar `backend/server.js`:**
```javascript
const allowedOrigins = [
    'https://josebacilio2004.github.io',
    'http://localhost:8080'
];
```

### Base de datos vacía

**Ejecutar schema de nuevo en Neon SQL Editor**

---

## 🎉 ¡Listo!

Tu sistema está completamente desplegado y funcional:

✅ Base de datos en Neon  
✅ Backend en Render  
✅ Frontend en GitHub Pages  
✅ WhatsApp configurado  

**¿Necesitas ayuda con algún paso?** ¡Avísame!
