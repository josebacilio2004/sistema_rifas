# Sistema de Rifas

Sistema completo de gestión de rifas con frontend interactivo y backend robusto.

## 🚀 Características

- ✅ Sistema de registro y autenticación de usuarios
- ✅ Compra y reserva de rifas en tiempo real
- ✅ Notificaciones de WhatsApp automáticas
- ✅ Panel de carrito de compras
- ✅ Códigos QR para pagos Yape
- ✅ Liberación automática de rifas no pagadas
- ✅ Interfaz moderna y responsiva

## 🛠️ Tecnologías

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Interfaz moderna con animaciones
- Responsive design

### Backend
- Node.js + Express
- PostgreSQL
- WhatsApp Business API
- Docker

## 📦 Estructura del Proyecto

```
sistema_rifas/
├── frontend/          # Aplicación web del cliente
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── backend/           # API del servidor
│   ├── routes/
│   ├── services/
│   ├── db/
│   └── server.js
├── docker-compose.yml
└── render.yaml       # Configuración para Render
```

## 🚀 Despliegue

### Frontend (GitHub Pages)

El frontend está desplegado automáticamente en GitHub Pages desde la rama `main`.

**URL:** https://josebacilio2004.github.io/sistema_rifas/

### Backend (Render)

El backend se despliega automáticamente en Render desde este repositorio.

## 🔧 Configuración Local

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- PostgreSQL (o usar Docker)

### Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/josebacilio2004/sistema_rifas.git
cd sistema_rifas
```

2. **Iniciar servicios con Docker:**
```bash
cd backend
docker-compose up
```

3. **Servir el frontend:**
```bash
npx http-server frontend -p 8080
```

4. **Acceder a:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

## 📱 WhatsApp Business API

El sistema usa WhatsApp Business API para enviar notificaciones automáticas.

### Variables de Entorno Requeridas

Crear archivo `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Frontend URL
FRONTEND_URL=https://josebacilio2004.github.io/sistema_rifas

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_token_de_acceso
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
WHATSAPP_ADMIN_NUMBER=+51964910248

# Yape
YAPE_PHONE=+51987654321
YAPE_NAME=Sistema de Rifas
```

### Configurar WhatsApp

Ver guía completa en: [WHATSAPP_BUSINESS_SETUP.md](./WHATSAPP_BUSINESS_SETUP.md)

## 📊 Base de Datos

### Schema

- `users` - Usuarios registrados
- `raffles` - Rifas disponibles
- `transactions` - Transacciones de pago

### Migraciones

Las tablas se crean automáticamente al iniciar el backend por primera vez.

## 🔒 Seguridad

- ✅ Variables de entorno para secretos
- ✅ CORS configurado
- ✅ Validación de datos
- ✅ Conexiones seguras a base de datos

## 📝 Licencia

MIT License - Ver [LICENSE](./LICENSE)

## 👨‍💻 Autor

**Jose Bacilio**
- GitHub: [@josebacilio2004](https://github.com/josebacilio2004)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue first para discutir cambios mayores.

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para preguntas o soporte, abre un issue en el repositorio.

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
