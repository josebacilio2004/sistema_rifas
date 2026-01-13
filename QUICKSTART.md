# 🚀 Guía de Inicio Rápido

Esta guía te ayudará a levantar el sistema de rifas localmente en pocos pasos.

## ✅ Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- [x] **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop)
- [x] **Git** (opcional) - [Descargar aquí](https://git-scm.com/)

## 📦 Paso 1: Verificar Docker

Abre PowerShell y verifica que Docker esté instalado:

```powershell
docker --version
docker-compose --version
```

Deberías ver algo como:
```
Docker version 24.0.x
Docker Compose version v2.x.x
```

## 🎬 Paso 2: Iniciar el Sistema

### Opción A: Con Docker (Recomendado)

Abre PowerShell en la carpeta del proyecto (`c:\Bacilio\Rifa`) y ejecuta:

```powershell
# Iniciar todos los servicios
docker-compose up -d

# Ver los logs
docker-compose logs -f
```

Esto iniciará:
- ✅ PostgreSQL (Base de datos) en puerto 5432
- ✅ Backend API en puerto 3000

Para verificar que todo está corriendo:

```powershell
docker ps
```

Deberías ver dos contenedores: `rifa-postgres` y `rifa-backend`

### Opción B: Sin Docker (Alternativa)

Si prefieres **no usar Docker**, sigue estos pasos:

#### 2.1 Instalar dependencias del backend

```powershell
cd backend
npm install
```

#### 2.2 Configurar PostgreSQL local

Necesitarás tener PostgreSQL instalado localmente. Luego:

```powershell
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE rifa_db;
CREATE USER rifauser WITH PASSWORD 'rifapass123';
GRANT ALL PRIVILEGES ON DATABASE rifa_db TO rifauser;

# Conectar a rifa_db
\c rifa_db

# Ejecutar schema
\i schema.sql
```

#### 2.3 Iniciar el backend

```powershell
cd backend
npm run dev
```

## 🌐 Paso 3: Abrir el Frontend

El frontend es un simple HTML, puedes abrirlo de varias formas:

### Opción A: Servidor HTTP Simple (Recomendado)

Con Node.js instalado:

```powershell
npx -y http-server frontend -p 8080
```

Luego abre en tu navegador: **http://localhost:8080**

### Opción B: Abrir directamente

Navega a `c:\Bacilio\Rifa\frontend` y haz doble clic en `index.html`

> ⚠️ **Nota**: Algunos navegadores pueden bloquear las peticiones API si abres el archivo directamente. Es mejor usar la Opción A.

## 🎯 Paso 4: Probar el Sistema

1. **Abre** http://localhost:8080 en tu navegador
2. **Registra** un usuario con:
   - Nombre: Tu nombre
   - Apellido: Tu apellido
   - DNI: 12345678 (8 dígitos)
   - Celular: +51987654321

3. **Selecciona** un número de rifa (por ejemplo, el número 7)
4. **Verás** el modal de pago con el QR de Yape
5. **Observa** cómo el temporizador cuenta regresivamente desde 5:00

## 🔍 Verificar que Todo Funciona

### Verificar Backend

Abre http://localhost:3000/health en tu navegador. Deberías ver:

```json
{
  "status": "OK",
  "timestamp": "2026-01-12T...",
  "service": "Rifa Backend API"
}
```

### Verificar Base de Datos

```powershell
# Con Docker
docker exec -it rifa-postgres psql -U rifauser -d rifa_db -c "SELECT COUNT(*) FROM raffles;"

# Sin Docker
psql -U rifauser -d rifa_db -c "SELECT COUNT(*) FROM raffles;"
```

Deberías ver: `count = 100` (los 100 números de rifa)

### Verificar API Endpoints

Puedes usar el navegador o herramientas como Postman:

- **GET** http://localhost:3000/api/raffles - Ver todas las rifas
- **GET** http://localhost:3000/health - Health check

## 🛑 Detener el Sistema

### Con Docker

```powershell
# Detener sin borrar datos
docker-compose stop

# Detener y borrar todo
docker-compose down

# Detener y borrar TODO incluyendo volúmenes
docker-compose down -v
```

### Sin Docker

Presiona `Ctrl + C` en la terminal donde corre `npm run dev`

## 🔄 Reiniciar el Sistema

```powershell
# Con Docker
docker-compose restart

# O simplemente
docker-compose up -d
```

## 🐛 Problemas Comunes

### "Cannot connect to database"

**Solución**: Espera 10-15 segundos después de `docker-compose up` para que PostgreSQL termine de iniciarse.

### "Port 3000 is already in use"

**Solución**: 
```powershell
# Ver qué está usando el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número que veas)
taskkill /PID <PID> /F
```

### "403 Forbidden" o "CORS Error"

**Solución**: Asegúrate de estar usando `http://localhost:8080` y no abriendo el archivo HTML directamente.

### El frontend no carga los datos

**Solución**: Verifica que `frontend/js/config.js` tenga la URL correcta:

```javascript
API_URL: 'http://localhost:3000/api'
```

## 📚 Siguientes Pasos

Una vez que todo funcione localmente:

1. ✅ Lee el [README.md](../README.md) completo
2. ✅ Prueba el flujo completo de reserva y pago
3. ✅ Configura n8n para notificaciones (opcional)
4. ✅ Cuando estés listo, despliega a producción

## 🆘 Ayuda

Si tienes problemas:

1. Revisa los logs: `docker-compose logs -f backend`
2. Verifica que Docker Desktop esté corriendo
3. Asegúrate de estar en la carpeta correcta: `c:\Bacilio\Rifa`

---

¡Listo! 🎉 Ahora tienes tu sistema de rifas corriendo localmente.
