# Script para Exportar Base de Datos - PROVETCARE
# Crea un backup de la base de datos para transferir a otra PC

param(
    [string]$OutputPath = ".\provetcare_db_backup.sql"
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  EXPORTAR BASE DE DATOS - PROVETCARE" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar PostgreSQL
Write-Host "Verificando PostgreSQL..." -ForegroundColor Yellow
$pgDumpPath = ""

# Buscar pg_dump en rutas comunes
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\14\bin\pg_dump.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $pgDumpPath = $path
        break
    }
}

if ($pgDumpPath -eq "") {
    Write-Host "ERROR: No se encontro pg_dump.exe" -ForegroundColor Red
    Write-Host "Opciones:" -ForegroundColor Yellow
    Write-Host "1. Asegurate de que PostgreSQL este instalado" -ForegroundColor Gray
    Write-Host "2. Usa pgAdmin para exportar: Click derecho en DB -> Backup" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host "OK pg_dump encontrado: $pgDumpPath" -ForegroundColor Green
Write-Host ""

# Exportar base de datos
Write-Host "Exportando base de datos a: $OutputPath" -ForegroundColor Yellow
Write-Host "Se te pedira la contraseña de PostgreSQL..." -ForegroundColor Gray
Write-Host ""

try {
    & $pgDumpPath -U postgres -d provetcare_db -f $OutputPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "EXITO - Base de datos exportada" -ForegroundColor Green
        Write-Host ""
        Write-Host "Archivo creado: $OutputPath" -ForegroundColor White
        $fileSize = (Get-Item $OutputPath).Length / 1KB
        Write-Host "Tamaño: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Para importar en otra PC:" -ForegroundColor Cyan
        Write-Host "  psql -U postgres -d provetcare_db -f $OutputPath" -ForegroundColor White
    }
    else {
        Write-Host ""
        Write-Host "ERROR: Fallo la exportacion" -ForegroundColor Red
        Write-Host "Verifica usuario y contraseña de PostgreSQL" -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
pause
