# Script para reiniciar servidor PROVETCARE
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  REINICIANDO SERVIDOR PROVETCARE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Matar procesos en puerto 5000
Write-Host "[1/3] Deteniendo procesos en puerto 5000..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | 
Select-Object -Property OwningProcess | 
ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}
Write-Host "✓ Procesos detenidos" -ForegroundColor Green

# 2. Esperar
Write-Host ""
Write-Host "[2/3] Esperando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "✓ Listo" -ForegroundColor Green

# 3. Iniciar servidor
Write-Host ""
Write-Host "[3/3] Iniciando servidor..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
npm start
