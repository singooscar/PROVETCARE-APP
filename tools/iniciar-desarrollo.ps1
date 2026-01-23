# Script para iniciar PROVETCARE en modo desarrollo
# Autor: PROVETCARE Team
# Descripción: Inicia automáticamente backend y frontend en terminales separadas

Write-Host "🐾 PROVETCARE - Iniciando entorno de desarrollo..." -ForegroundColor Cyan
Write-Host ""

# Ruta base del proyecto
$PROJECT_ROOT = $PSScriptRoot

# Verificar que Node.js está instalado
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar que PostgreSQL está corriendo
Write-Host "Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service | Where-Object {$_.Name -like "postgresql*"} | Select-Object -First 1

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL detectado pero no está corriendo" -ForegroundColor Yellow
        Write-Host "Intentando iniciar PostgreSQL..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Start-Sleep -Seconds 2
        Write-Host "✅ PostgreSQL iniciado" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  PostgreSQL no detectado o no está instalado como servicio" -ForegroundColor Yellow
    Write-Host "Asegúrate de que PostgreSQL esté corriendo manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Iniciando servicios..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar Backend en nueva ventana
Write-Host "🔴 Iniciando Backend (puerto 5000)..." -ForegroundColor Red
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_ROOT\server'; Write-Host '🔴 BACKEND - PROVETCARE' -ForegroundColor Red; Write-Host ''; npm run dev"

# Esperar un momento para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar Frontend en nueva ventana
Write-Host "🟢 Iniciando Frontend (puerto 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_ROOT\client'; Write-Host '🟢 FRONTEND - PROVETCARE' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Servicios iniciados correctamente" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Backend API:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "🌐 Frontend:     http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "   Admin:   admin@provetcare.com / admin123" -ForegroundColor White
Write-Host "   Cliente: juan.perez@email.com / cliente123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Espera 10-15 segundos para que los servicios estén completamente listos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para detener los servicios, cierra las ventanas del backend y frontend" -ForegroundColor Gray
Write-Host ""

# Esperar 8 segundos y abrir el navegador
Write-Host "Abriendo navegador en 8 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 8
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "🐾 ¡PROVETCARE está listo! Presiona cualquier tecla para cerrar este mensaje..." -ForegroundColor Green
pause
