@echo off
echo ==========================================
echo   REINICIANDO SERVIDOR PROVETCARE
echo ==========================================
echo.

echo [1/3] Deteniendo procesos en puerto 5000...
powershell -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -Property OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [2/3] Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo [3/3] Iniciando servidor...
echo.
npm start
