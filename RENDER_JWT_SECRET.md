# 🔑 Actualizar JWT_SECRET en Render

## Paso 1: Ir a Render Dashboard

1. Ve a: **https://dashboard.render.com**
2. Inicia sesión con tu cuenta

## Paso 2: Seleccionar el Servicio

1. En tu dashboard, busca tu servicio: **`sistema-rifas-backend`**
2. Click en el nombre del servicio

## Paso 3: Ir a Variables de Entorno

1. En el menú lateral izquierdo, click en **"Environment"**
2. Verás la lista de todas tus variables de entorno

## Paso 4: Agregar JWT_SECRET

### Opción A: Si no existe la variable

1. Click en **"Add Environment Variable"**
2. En **Key** escribe: `JWT_SECRET`
3. En **Value** pega:
   ```
   sistema_rifas_secret_2026_change_in_production_abc123xyz789
   ```
   (O genera uno más seguro: https://randomkeygen.com/)

4. Click **"Save Changes"**

### Opción B: Si ya existe

1. Busca la variable `JWT_SECRET` en la lista
2. Click en el **icono de lápiz** ✏️ al lado
3. Actualiza el valor
4. Click **"Save Changes"**

## Paso 5: Redespliegue Automático

Render redesplegará automáticamente el backend en ~2-3 minutos.

## ✅ Verificar que Funcionó

1. Espera 3 minutos
2. Ve a: https://josebacilio2004.github.io/sistema_rifas/admin.html
3. Intenta hacer login con:
   - Usuario: `faustina`
   - Contraseña: `faustina2026`

Si el login funciona, JWT_SECRET está correctamente configurado.

---

## 🔐 Generar JWT_SECRET Más Seguro (Opcional)

### Opción 1: En PowerShell
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

### Opción 2: En Node.js
```javascript
require('crypto').randomBytes(64).toString('hex')
```

### Opción 3: Online
- https://randomkeygen.com/ (Fort Knox Passwords)

Copia el resultado y úsalo como valor de `JWT_SECRET` en Render.

---

**✨ Tip:** Guarda el JWT_SECRET en un lugar seguro (ej: gestor de contraseñas) por si necesitas accederlo después.
