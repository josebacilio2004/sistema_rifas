# 🎪 Guía Rápida: Gestor de Carrusel para Admins

## 📋 Resumen

Los administradores ahora pueden gestionar las imágenes y premios del carrusel de la landing page directamente desde el panel de administración, sin necesidad de editar código.

---

## 🔑 Acceso al Panel Admin

**URL:** https://josebacilio2004.github.io/sistema_rifas/admin.html

**Credenciales:**
- Usuario: `faustina` o `christian`
- Contraseña: `faustina2026` o `christian2026`

---

## 🎨 Gestionar Premios del Carrusel

### Ver Premios Actuales

1. Inicia sesión en el panel admin
2. Desliza hacia abajo hasta la sección **"🎪 Gestión del Carrusel"**
3. Verás tarjetas con todos los premios actuales

### Agregar Nuevo Premio

1. Click en botón **"+ Agregar Premio"**
2. Llena el formulario:
   - **Título:** Nombre del premio (ej: 📱 iPhone 16 Pro Max)
   - **Descripción:** Detalles del premio
   - **URL de la Imagen:** Link de la imagen (ver abajo cómo subir)
   - **Orden:** Número de orden (0, 1, 2, 3...)
3. Click **"Guardar"**

### Editar Premio

1. Click en **"✏️ Editar"** en la tarjeta del premio
2. Modifica los campos que desees
3. Click **"Guardar"**

### Eliminar Premio

1. Click en **"🗑️ Eliminar"** en la tarjeta del premio
2. Confirma la eliminación
3. El premio desaparecerá del carrusel

---

## 📸 Cómo Subir Imágenes

Para usar imágenes en el carrusel, necesitas subirlas a un hosting de imágenes y obtener la URL.

### Opción 1: Imgur (Recomendado)

1. Ve a: https://imgur.com
2. Click en **"New post"**
3. Sube tu imagen
4. Click derecho en la imagen → **"Copy image address"**
5. Pega la URL en el campo "URL de la Imagen"

### Opción 2: ImgBB

1. Ve a: https://imgbb.com
2. Click en **"Start uploading"**
3. Sube tu imagen
4. Copia el link que aparece como "Direct link"
5. Pega la URL en el campo "URL de la Imagen"

### Opción 3: Google Drive (Público)

1. Sube imagen a Google Drive
2. Click derecho → **"Get link"**
3. Cambia a **"Anyone with the link"**
4. Usa un conversor como: https://www.gdurl.com/
5. Pega la URL resultante

---

## 💡 Consejos

### Tamaño de Imágenes
- **Recomendado:** 450x450 píxeles (cuadradas)
- **Máximo:** No más de 2MB por imagen
- **Formato:** JPG, PNG o WebP

### Orden de los Premios
- Los números más bajos aparecen primero
- Usa: 0, 1, 2, 3... para orden secuencial
- Puedes usar 10, 20, 30... para dejar espacio entre premios

### Títulos Llamativos
Usa emojis para hacer más atra ctivos los títulos:
- 📱 para electrónicos
- 🎮 para consolas
- 💻 para laptops
- 📺 para televisores
- 🎁 para premios generales

---

## 🔄 Actualización JWT_SECRET en Render

Para que el panel admin funcione en producción:

1. Ve a: https://dashboard.render.com
2. Selecciona **"sistema-rifas-backend"**
3. Click en **"Environment"** (menú lateral)
4. Click **"Add Environment Variable"**
5. Key: `JWT_SECRET`
6. Value: `sistema_rifas_secret_2026_change_in_production_abc123xyz789`
   - (O genera uno más seguro en: https://randomkeygen.com/)
7. Click **"Save Changes"**
8. Espera 2-3 minutos para el redespliegue

**Ver guía completa:** [RENDER_JWT_SECRET.md](file:///c:/Bacilio/Rifa/RENDER_JWT_SECRET.md)

---

## 📝 Migraciones Pendientes en Neon

Para que todo funcione, ejecuta esta migración en Neon SQL Editor:

**Archivo:** `backend/migrations/003_carousel_items.sql`

1. Ve a: https://console.neon.tech
2. Selecciona tu proyecto
3. Click en **"SQL Editor"**
4. Copia y pega el contenido de `003_carousel_items.sql`
5. Click **"Run"**

---

## ✅ Verificar que Funciona

1. **Agrega un premio de prueba** en el panel admin
2. **Ve a la landing page:** https://josebacilio2004.github.io/sistema_rifas/landing.html
3. **Deberías ver** tu nuevo premio en el carrusel
4. **El carrusel** rotará automáticamente cada 5 segundos

---

## 🆘 Solución de Problemas

### "Error al cargar items"
- Verifica que ejecutaste la migración `003_carousel_items.sql` en Neon
- Verifica que JWT_SECRET esté configurado en Render

### "Token inválido"
- Cierra sesión y vuelve a iniciar sesión

### "Error al guardar"
- Verifica que la URL de la imagen sea válida y accesible
- Intenta abrir la URL en otra pestaña para confirmar

### La imagen no se muestra en el carrusel
- Verifica que la URL sea directa a la imagen (debe terminar en .jpg, .png, etc.)
- Asegúrate de usar "Direct link" no "Share link"

---

**¡Listo!** Ahora puedes gestionar el carrusel fácilmente desde el panel admin. 🎉
