# 🔌 Guía de Ejecución Sin Internet - PROVETCARE

## ✅ Requisitos Previos (Instalar CON Internet)

Antes de desconectarte, asegúrate de tener instalado:

### 1. Software Base
- ✅ **Node.js** (v18 o superior) - Ya instalado si puedes ejecutar `node -v`
- ✅ **PostgreSQL** (v14 o superior) - Base de datos local
- ✅ **Git** (opcional) - Solo para control de versiones

### 2. Dependencias del Proyecto
Ejecuta estos comandos **una sola vez** mientras tengas internet:

```powershell
# Backend (servidor)
cd c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\server
npm install

# Frontend (cliente)
cd c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\client
npm install
```

---

## 🚀 Ejecución Sin Internet

### Paso 1: Iniciar PostgreSQL

PostgreSQL debe estar corriendo como servicio. Verifica con:

```powershell
# Verificar estado del servicio
Get-Service postgresql*

# Si no está corriendo, iniciarlo:
Start-Service postgresql-x64-18
```

### Paso 2: Iniciar el Backend

```powershell
cd c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\server
npm run dev
```

Deberías ver:
```
✅ PROVETCARE Server v1.0.0
🌐 Corriendo en puerto 5000
💬 Socket.io: Configurado
```

### Paso 3: Iniciar el Frontend

Abre otra terminal:

```powershell
cd c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\client
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Paso 4: Abrir en el Navegador

Abre **http://localhost:5173** en tu navegador.

---

## ⚠️ Funcionalidades Limitadas Sin Internet

| Funcionalidad | Online | Offline |
|---------------|--------|---------|
| Login/Registro | ✅ | ✅ |
| Ver Citas | ✅ | ✅ |
| Crear Citas | ✅ | ✅ |
| Historial Médico | ✅ | ✅ |
| Generar PDF Recetas | ✅ | ✅ |
| **Envío de Emails** | ✅ | ❌ |
| **Google Fonts** | ✅ | ⚠️ Usa fuentes sistema |

> **Nota**: Los emails de recordatorio no se enviarán sin internet, pero las citas se crearán normalmente.

---

## 🛠️ Script de Inicio Rápido (Offline)

Crea este archivo para iniciar todo con un doble clic:

### `iniciar-provetcare.bat`

```batch
@echo off
title PROVETCARE - Modo Offline
echo ========================================
echo    INICIANDO PROVETCARE (Sin Internet)
echo ========================================

:: Verificar PostgreSQL
echo [1/3] Verificando PostgreSQL...
net start postgresql-x64-18 2>nul

:: Iniciar Backend
echo [2/3] Iniciando Backend...
start "PROVETCARE Backend" cmd /k "cd /d c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\server && npm run dev"

:: Esperar 3 segundos
timeout /t 3 /nobreak > nul

:: Iniciar Frontend
echo [3/3] Iniciando Frontend...
start "PROVETCARE Frontend" cmd /k "cd /d c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\client && npm run dev"

:: Esperar y abrir navegador
timeout /t 5 /nobreak > nul
echo.
echo [OK] Abriendo navegador...
start http://localhost:5173

echo.
echo ========================================
echo    PROVETCARE está listo!
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
echo ========================================
pause
```

---

## 📦 Empaquetar para Otra Computadora

Si necesitas llevar el proyecto a otra PC sin internet:

### Archivos a Copiar:
```
PROVETCAREE/
├── client/           # Incluir TODO (con node_modules)
├── server/           # Incluir TODO (con node_modules)
├── uploads/          # Archivos subidos
└── README.md
```

### Archivos a EXCLUIR:
```
.git/                 # Carpeta de Git (muy grande)
server/.env           # Crear uno nuevo en la otra PC
```

### En la Otra Computadora:
1. Instalar Node.js
2. Instalar PostgreSQL
3. Crear base de datos `provetcare_db`
4. Ejecutar `server/database/init.sql`
5. Crear archivo `.env` con credenciales locales
6. Ejecutar el script `iniciar-provetcare.bat`

---

## 🔧 Solución de Problemas Offline

### Error: "Cannot find module..."
```powershell
# Reinstalar dependencias (requiere internet una vez)
cd server && npm install
cd ../client && npm install
```

### Error: "Connection refused" (PostgreSQL)
```powershell
# Iniciar servicio de PostgreSQL
Start-Service postgresql-x64-18
```

### Error: "Port 5000 already in use"
```powershell
# Cerrar proceso en puerto 5000
netstat -ano | findstr :5000
taskkill /PID <numero_pid> /F
```

---

## ✅ Verificación Final

Para confirmar que todo funciona offline:

1. ❌ Desconecta el WiFi/Ethernet
2. ✅ Ejecuta `iniciar-provetcare.bat`
3. ✅ Abre http://localhost:5173
4. ✅ Intenta hacer login
5. ✅ Navega por las citas

Si todo funciona, ¡estás listo para usar PROVETCARE sin internet!
