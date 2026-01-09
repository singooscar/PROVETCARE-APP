# 🐾 PROVETCARE

**Sistema Web para Agendamiento de Citas Veterinarias**

Sistema moderno y completo para la gestión de citas veterinarias, desarrollado como MVP para digitalizar el proceso que actualmente se maneja con cuadernos y WhatsApp.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io /badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Seguridad](#-seguridad)
- [Troubleshooting](#-troubleshooting)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características

### Para Clientes
- ✅ **Registro y Autenticación Segura** - Sistema JWT con tokens de 7 días
- 📅 **Calendario Interactivo** - Visualiza y agenda citas fácilmente
- 🐕 **Gestión de Mascotas** - CRUD completo con información detallada
- 💬 **Chat en Tiempo Real** - Comunicación directa con la clínica
- 📱 **Recordatorios Automáticos** - Emails 24h antes de la cita
- 📊 **Dashboard Personalizado** - Vista general de tus citas y mascotas

### Para Administradores
- ✅ **Gestión de Citas** - Aprobar, rechazar o completar citas
- 👥 **Vista de Todos los Clientes** - Acceso completo a la información
- 📈 **Estadísticas en Tiempo Real** - Citas pendientes, completadas, etc.
- 💬 **Chat Multi-usuario** - Atención a múltiples clientes
- 📋 **Historial Médico** - Registro de consultas y tratamientos

### Características Técnicas
- 🔒 **Seguridad Robusta** - Protección contra XSS, SQL Injection, CSRF
- 📱 **Responsive Design** - Funciona perfectamente en móvil y escritorio
- ⚡ **Tiempo Real** - Socket.io para chat instantáneo
- 🎨 **UI Moderna** - TailwindCSS con animaciones suaves
- 🔄 **API RESTful** - Endpoints bien documentados y organizados

---

## 🛠 Stack Tecnológico

### Backend
- **Runtime:** Node.js (>=18.0.0)
- **Framework:** Express.js
- **Base de Datos:** PostgreSQL
- **Autenticación:** JSON Web Tokens (JWT)
- **Validación:** Zod
- **Real-time:** Socket.io
- **Email:** Nodemailer
- **Seguridad:** Helmet, CORS, Bcrypt

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS 3
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Calendar:** React Big Calendar
- **Notifications:** React Hot Toast
- **Icons:** Lucide React

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **PostgreSQL** >= 14.0 ([Descargar](https://www.postgresql.org/download/))
- **Git** ([Descargar](https://git-scm.com/downloads))
- **npm** (incluido con Node.js)

### Verificar instalaciones:
```bash
node --version   # Debe mostrar v18.x.x o superior
npm --version    # Debe mostrar 9.x.x o superior
psql --version   # Debe mostrar 14.x o superior
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd PROVETCAREE
```

### 2. Instalar Dependencias

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Configurar Base de Datos

**Opción A: Usando psql (Línea de comandos)**
```bash
cd server
psql -U postgres -f database/init.sql
```

**Opción B: Usando pgAdmin**
1. Abrir pgAdmin
2. Crear nueva consulta
3. Abrir el archivo `server/database/init.sql`
4. Ejecutar el script

El script creará:
- Base de datos `provetcare_db`
- Todas las tablas necesarias
- Índices y constraints
- Datos de prueba (usuarios, mascotas, citas)

### 4. Configurar Variables de Entorno

**Backend - Crear archivo `.env` en `/server`:**
```bash
cd server
cp .env.example .env
```

**Editar `server/.env` con tus valores:**
```env
# Puerto del servidor
PORT=5000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=provetcare_db
DB_USER=postgres
DB_PASSWORD=tu_password_postgres

# JWT
JWT_SECRET=genera_un_secret_seguro_aqui
JWT_EXPIRES_IN=7d

# Email (para recordatorios)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password_gmail

# Frontend URL
CLIENT_URL=http://localhost:5173
```

**Frontend - Crear archivo `.env` en `/client` (opcional):**
```env
VITE_API_URL=http://localhost:5000
```

> **Nota para Gmail:** Necesitas generar un "App Password" en https://myaccount.google.com/apppasswords

---

## 🏃 Uso

### Desarrollo

**Iniciar Backend:**
```bash
cd server
npm run dev
```
Servidor corriendo en: http://localhost:5000

**Iniciar Frontend (en otra terminal):**
```bash
cd client
npm run dev
```
Aplicación corriendo en: http://localhost:5173

### Producción

**Build Frontend:**
```bash
cd client
npm run build
```

**Iniciar Servidor:**
```bash
cd server
npm start
```

---

## 📁 Estructura del Proyecto

```
PROVETCAREE/
├── client/                   # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/          # Context API
│   │   │   └── AuthContext.jsx
│   │   ├── pages/            # Páginas principales
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Pets.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/         # API clients
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                   # API Backend
│   ├── config/
│   │   └── db.js            # Configuración PostgreSQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── petController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── validators.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── petRoutes.js
│   │   └── chatRoutes.js
│   ├── services/
│   │   └── reminderService.js
│   ├── database/
│   │   └── init.sql
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── docs/                     # Documentación
    ├── MATRIZ_VULNERABILIDADES.md
    ├── ERRORES_CONOCIDOS.md
    └── README.md
```

---

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/register     - Registrar nuevo usuario
POST   /api/auth/login        - Iniciar sesión
GET    /api/auth/verify       - Verificar token JWT
GET    /api/auth/profile      - Obtener perfil de usuario
```

### Citas
```
GET    /api/appointments              - Listar citas (filtradas por rol)
POST   /api/appointments              - Crear nueva cita
GET    /api/appointments/:id          - Obtener cita específica
PUT    /api/appointments/:id          - Actualizar cita
DELETE /api/appointments/:id          - Cancelar cita
PUT    /api/appointments/:id/approve  - Aprobar cita (admin)
PUT    /api/appointments/:id/reject   - Rechazar cita (admin)
GET    /api/appointments/availability - Ver disponibilidad
```

### Mascotas
```
GET    /api/pets                    - Listar mascotas del usuario
POST   /api/pets                    - Registrar nueva mascota
GET    /api/pets/:id                - Obtener mascota específica
PUT    /api/pets/:id                - Actualizar mascota
DELETE /api/pets/:id                - Eliminar mascota
GET    /api/pets/:id/medical-records - Historial médico
POST   /api/pets/:id/medical-records - Crear registro médico (admin)
```

### Chat
```
GET    /api/chat/conversations  - Lista de conversaciones
GET    /api/chat/messages       - Mensajes de conversación
POST   /api/chat/messages       - Enviar mensaje
PUT    /api/chat/messages/read  - Marcar como leído
```

**Formato de Response:**
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": {
    // Datos de respuesta
  }
}
```

---

## 🔒 Seguridad

### Medidas Implementadas

✅ **SQL Injection** - Prepared Statements en todas las queries  
✅ **XSS** - React auto-escaping + validación de inputs  
✅ **CSRF** - CORS restrictivo + tokens en headers  
✅ **Autenticación** - JWT + Bcrypt (cost factor 10)  
✅ **Autorización** - Middleware de roles + verificación de ownership  
✅ **Rate Limiting** - 100 requests/15min por IP  
✅ **Validación** - Zod schemas en todos los endpoints  
✅ **Headers Seguros** - Helmet configurado  

### Credenciales de Prueba

**Administrador:**
- Email: `admin@provetcare.com`
- Password: `admin123`

**Cliente de Prueba:**
- Email: `juan.perez@email.com`
- Password: `cliente123`

> ⚠️ **IMPORTANTE:** Cambiar estas credenciales en producción

Ver documentación completa en: [`docs/MATRIZ_VULNERABILIDADES.md`](docs/MATRIZ_VULNERABILIDADES.md)

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to database"

**Solución:**
1. Verificar que PostgreSQL esté corriendo
2. Revisar credenciales en `.env`
3. Confirmar que la base de datos existe

### Problema: "CORS Error"

**Solución:**
Verificar que `CLIENT_URL` en `server/.env` coincida con la URL del frontend.

### Problema: "Port already in use"

**Solución:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Problema: Chat no conecta

**Solución:**
Verificar que `VITE_API_URL` en `client/.env` apunte al servidor correcto.

Para más detalles: [`docs/ERRORES_CONOCIDOS.md`](docs/ERRORES_CONOCIDOS.md)

---

## 👨‍💻 Scripts Disponibles

### Backend (`/server`)
```bash
npm start       # Iniciar servidor producción
npm run dev     # Iniciar con nodemon (desarrollo)
npm run init-db # Inicializar base de datos
```

### Frontend (`/client`)
```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build para producción
npm run preview # Preview del build
npm run lint    # Ejecutar ESLint
```

---

## 🎯 Roadmap Futuro

- [ ] Pasarela de pagos integrada
- [ ] Notificaciones push
- [ ] App móvil nativa (React Native)
- [ ] Videollamadas integradas
- [ ] Sistema de inventario de medicamentos
- [ ] Multi-lenguaje (i18n)
- [ ] Modo oscuro
- [ ] Exportar reportes PDF
- [ ] Integración con calendarios externos

---

## 📝 Documentación Adicional

- 🔒 [Matriz de Vulnerabilidades](docs/MATRIZ_VULNERABILIDADES.md) - Análisis de seguridad completo
- 🐛 [Errores Conocidos](docs/ERRORES_CONOCIDOS.md) - Guía de troubleshooting detallada

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👥 Autores

**PROVETCARE Development Team**

- Sistema diseñado para proyecto de titulación - Enero 2026
- Stack: React + Node.js + PostgreSQL + Socket.io

---

## 📞 Soporte

Para reportar bugs o solicitar features:
- Crear un Issue en GitHub
- Email: soporte@provetcare.com (en desarrollo)

---

## 🙏 Agradecimientos

- Clínicas veterinarias que inspiraron este proyecto
- Comunidad open-source por las herramientas utilizadas
- Usuarios que participaron en la investigación inicial

---

**Desarrollado con ❤️ para mejorar la atención veterinaria**

🐾 PROVETCARE - Cuidando a quienes cuidan a nuestras mascotas
