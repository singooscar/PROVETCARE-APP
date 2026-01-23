@echo off
title PROVETCARE - Modo Offline
color 0A
echo.
echo ========================================
echo    INICIANDO PROVETCARE (Sin Internet)
echo ========================================
echo.

:: Verificar PostgreSQL
echo [1/3] Verificando PostgreSQL...
net start postgresql-x64-18 2>nul
if %errorlevel%==0 (
    echo       PostgreSQL iniciado correctamente
) else (
    echo       PostgreSQL ya estaba corriendo
)

:: Iniciar Backend
echo.
echo [2/3] Iniciando Backend (Puerto 5000)...
start "PROVETCARE Backend" cmd /k "cd /d c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\server && npm run dev"

:: Esperar 4 segundos
timeout /t 4 /nobreak > nul

:: Iniciar Frontend
echo.
echo [3/3] Iniciando Frontend (Puerto 5173)...
start "PROVETCARE Frontend" cmd /k "cd /d c:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\client && npm run dev"

:: Esperar y abrir navegador
timeout /t 6 /nobreak > nul
echo.
echo [OK] Abriendo navegador...
start http://localhost:5173

echo.
echo ========================================
echo    PROVETCARE ESTA LISTO!
echo ========================================
echo.
echo    Backend API:  http://localhost:5000
echo    Frontend:     http://localhost:5173
echo.
echo    Para detener: Cierra las ventanas de
echo    "PROVETCARE Backend" y "Frontend"
echo.
echo ========================================
echo.
pause
