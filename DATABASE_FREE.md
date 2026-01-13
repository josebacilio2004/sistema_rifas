# 🗄️ Base de Datos PostgreSQL Gratis - Neon

## ✅ Opción Recomendada: Neon

**Ventajas:**
- ✅ Plan free permanente
- ✅ No requiere tarjeta de crédito
- ✅ PostgreSQL real y completo
- ✅ 0.5 GB de almacenamiento
- ✅ Muy rápido de configurar

---

## 📝 Paso a Paso: Crear Base de Datos en Neon

### 1. Crear Cuenta

1. Ve a: **https://neon.tech**
2. Click **"Sign up"**
3. Regístrate con GitHub (más rápido)

### 2. Crear Proyecto

1. Una vez dentro, click **"Create a project"**
2. Configurar:
   - **Project name:** `sistema-rifas`
   - **Database name:** `rifa_db`
   - **Region:** `US East (Ohio)` o el más cercano
3. Click **"Create project"**

### 3. Copiar Connection String

Neon te mostrará inmediatamente el connection string:

```
postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/rifa_db?sslmode=require
```

**Copia esta URL completa** - la necesitarás para Render.

---

## 🔧 Configurar Base de Datos

### Opción 1: Usar SQL Editor de Neon (Más Fácil)

1. En Neon, click en **"SQL Editor"** (menú lateral)
2. Copia y pega el schema completo desde `backend/schema.sql`
3. Click **"Run"**
4. ✅ Tablas creadas

### Opción 2: Conectar desde Local

```bash
# Instalar psql si no lo tienes
# Luego conectar:
psql "postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/rifa_db?sslmode=require"

# Ejecutar schema
\i backend/schema.sql
```

---

## 🚀 Conectar con Render

### 1. Copiar Connection String de Neon

```
postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/rifa_db?sslmode=require
```

### 2. Ir a Render

1. Dashboard → Tu servicio backend
2. Click **"Environment"**
3. Agregar/Editar variable:
   - **Key:** `DATABASE_URL`
   - **Value:** (pegar el connection string de Neon)
4. Click **"Save Changes"**

### 3. Backend se Redesplega Automáticamente

Render detectará el cambio y redesplegará el backend.

---

## ✅ Verificar que Funciona

### Desde Neon SQL Editor:

```sql
-- Ver tablas creadas
\dt

-- Ver usuarios (debería estar vacío al inicio)
SELECT * FROM users;

-- Ver rifas
SELECT * FROM raffles;
```

### Desde tu App:

1. Ve a tu frontend: `https://josebacilio2004.github.io/sistema_rifas/`
2. Regístrate
3. Compra una rifa
4. Vuelve a Neon SQL Editor y verifica:

```sql
SELECT * FROM users;
SELECT * FROM raffles WHERE status = 'sold';
```

---

## 📊 Alternativa: Supabase

Si Neon tiene problemas, usa **Supabase**:

### 1. Crear Cuenta

1. Ve a: **https://supabase.com**
2. Sign up con GitHub

### 2. Crear Proyecto

1. Click **"New project"**
2. Configurar:
   - **Name:** `sistema-rifas`
   - **Database Password:** (genera una fuerte)
   - **Region:** `East US (North Virginia)`
3. Click **"Create new project"**
4. Espera ~2 minutos mientras se crea

### 3. Obtener Connection String

1. Click en **"Database"** (icono en lateral izquierdo)
2. Scroll hasta **"Connection string"**
3. Selecciona **"URI"**
4. Copia la URL:

```
postgresql://postgres:[TU-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

**Reemplaza `[TU-PASSWORD]`** con la contraseña que creaste.

### 4. Ejecutar Schema

1. Click en **"SQL Editor"**
2. Click **"New query"**
3. Pega el contenido de `backend/schema.sql`
4. Click **"Run"**

---

## 🔄 Migrar Datos de Local a Neon (Opcional)

Si ya tienes datos en tu base de datos local y quieres migrarlos:

### 1. Exportar de Local

```bash
docker exec rifa-postgres pg_dump -U rifauser rifa_db > backup.sql
```

### 2. Importar a Neon

```bash
psql "postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/rifa_db?sslmode=require" < backup.sql
```

---

## ⚡ Límites del Plan Free

### Neon Free:
- ✅ 0.5 GB de almacenamiento
- ✅ 1 proyecto
- ✅ Sin límite de queries
- ⏰ Base de datos se "suspende" después de 5 minutos de inactividad (se reactiva automáticamente en primera query)

### Supabase Free:
- ✅ 500 MB de almacenamiento
- ✅ 2 proyectos
- ✅ 50,000 autenticaciones/mes
- ⏰ Proyecto se pausa después de 1 semana de inactividad

**Recomendación:** Usa **Neon** - es más generoso y no se pausa por inactividad corta.

---

## 🎯 Resumen

1. ✅ Crear cuenta en Neon
2. ✅ Crear proyecto y base de datos
3. ✅ Copiar connection string
4. ✅ Ejecutar schema en SQL Editor
5. ✅ Agregar `DATABASE_URL` en Render
6. ✅ Esperar redespliegue
7. ✅ ¡Probar que funciona!

---

## 📱 Ejemplo de DATABASE_URL

```env
# Neon
DATABASE_URL=postgresql://neondb_owner:AbCd1234XyZ@ep-cool-sound-123456.us-east-2.aws.neon.tech/rifa_db?sslmode=require

# Supabase
DATABASE_URL=postgresql://postgres:tu-password@db.abcdefghijklm.supabase.co:5432/postgres
```

---

**¿Listo para crear tu base de datos en Neon?** Es rápido - toma solo 2 minutos. Avísame si necesitas ayuda con algún paso.
