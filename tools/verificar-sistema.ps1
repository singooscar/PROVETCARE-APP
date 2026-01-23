# Script de Verificacion - PROVETCARE
# Verifica que todos los servicios esten funcionando correctamente

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION DEL SISTEMA PROVETCARE" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "[1] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   OK Node.js $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ERROR Node.js no esta instalado" -ForegroundColor Red
}

# 2. Verificar npm
Write-Host "[2] Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   OK npm $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ERROR npm no esta instalado" -ForegroundColor Red
}

# 3. Verificar PostgreSQL
Write-Host "[3] Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service | Where-Object { $_.Name -like "postgresql*" } | Select-Object -First 1
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "   OK PostgreSQL esta corriendo ($($pgService.Name))" -ForegroundColor Green
    }
    else {
        Write-Host "   ADVERTENCIA PostgreSQL detectado pero detenido ($($pgService.Status))" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ADVERTENCIA PostgreSQL no detectado como servicio" -ForegroundColor Yellow
}

# 4. Verificar Backend (puerto 5000)
Write-Host "[4] Verificando Backend (puerto 5000)..." -ForegroundColor Yellow
$backend = netstat -ano | findstr ":5000"
if ($backend) {
    Write-Host "   OK Backend esta corriendo en puerto 5000" -ForegroundColor Green
    
    # Intentar hacer health check
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 3
        if ($response.status -eq "ok") {
            Write-Host "   OK Health Check: $($response.message)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   ADVERTENCIA Puerto ocupado pero health check fallo" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ERROR Backend NO esta corriendo" -ForegroundColor Red
}

# 5. Verificar Frontend (puerto 5173)
Write-Host "[5] Verificando Frontend (puerto 5173)..." -ForegroundColor Yellow
$frontend = netstat -ano | findstr ":5173"
if ($frontend) {
    Write-Host "   OK Frontend esta corriendo en puerto 5173" -ForegroundColor Green
}
else {
    Write-Host "   ERROR Frontend NO esta corriendo" -ForegroundColor Red
}

# 6. Verificar dependencias del servidor
Write-Host "[6] Verificando dependencias del servidor..." -ForegroundColor Yellow
if (Test-Path ".\server\node_modules") {
    Write-Host "   OK Dependencias del servidor instaladas" -ForegroundColor Green
}
else {
    Write-Host "   ERROR Falta instalar dependencias del servidor" -ForegroundColor Red
    Write-Host "      Ejecuta: cd server ; npm install" -ForegroundColor Gray
}

# 7. Verificar dependencias del cliente
Write-Host "[7] Verificando dependencias del cliente..." -ForegroundColor Yellow
if (Test-Path ".\client\node_modules") {
    Write-Host "   OK Dependencias del cliente instaladas" -ForegroundColor Green
}
else {
    Write-Host "   ERROR Falta instalar dependencias del cliente" -ForegroundColor Red
    Write-Host "      Ejecuta: cd client ; npm install" -ForegroundColor Gray
}

# 8. Verificar archivo .env
Write-Host "[8] Verificando configuracion (.env)..." -ForegroundColor Yellow
if (Test-Path ".\server\.env") {
    Write-Host "   OK Archivo .env encontrado" -ForegroundColor Green
}
else {
    Write-Host "   ADVERTENCIA Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "      Copia .env.example a .env y configura las variables" -ForegroundColor Gray
}

# 9. Verificar base de datos
Write-Host "[9] Verificando script de base de datos..." -ForegroundColor Yellow
if (Test-Path ".\server\database\init.sql") {
    Write-Host "   OK Script de inicializacion encontrado" -ForegroundColor Green
}
else {
    Write-Host "   ERROR Script de base de datos no encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

if ($backend -and $frontend) {
    Write-Host "EXITO - PROVETCARE esta completamente operativo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Accede a la aplicacion en:" -ForegroundColor Yellow
    Write-Host "   http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
    Write-Host "   Admin:   admin@provetcare.com / admin123" -ForegroundColor White
    Write-Host "   Cliente: juan.perez@email.com / cliente123" -ForegroundColor White
}
elseif (-not $backend -and -not $frontend) {
    Write-Host "ERROR - Los servicios NO estan corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para iniciar:" -ForegroundColor Yellow
    Write-Host "   Ejecuta: .\iniciar-desarrollo.ps1" -ForegroundColor White
}
else {
    Write-Host "PARCIAL - Algunos servicios no estan corriendo completamente" -ForegroundColor Yellow
    if (-not $backend) {
        Write-Host "   ERROR Backend (puerto 5000) detenido" -ForegroundColor Red
    }
    if (-not $frontend) {
        Write-Host "   ERROR Frontend (puerto 5173) detenido" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
pause
