# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  


---

# SEMANA 6: COPIAS DE RESPALDO Y MONITOREO FINAL

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Consolidar el sistema, documentación final y monitoreo estable.

**RESULTADO ESPERADO:**  
Sistema estable 24/7, documentación 100% completa y listo para producción.

**INDICADOR:**  
- Uptime continuo
- Documentación completada

**VALOR INICIAL DEL INDICADOR:**  
- Uptime: Variable
- Docs: 70%

**ACTIVIDAD:**  
1. Validación final de backups (Restauración).
2. Manual de Operaciones y Runbook.
3. Informe Final.

**EVIDENCIA DETALLADA:**

### 1. Informe Final de Logros
- **Uptime:** 99.9% (168h continuas sin fallos).
- **Rendimiento:** Latencia mejorada a 420ms promedio.
- **Seguridad:** 0 vulnerabilidades críticas.

### 2. Manual de Operaciones (Extracto)
- **Inicio:** `pm2 start ecosystem.config.js`
- **Backup Manual:** `powershell ./server/scripts/backup-database.ps1`
- **Restauración:** `powershell ./server/scripts/restore-database.ps1 -file [archivo]`

### 3. Código de Justificación: Script Restauración Verificada

```powershell
# server/scripts/restore-database.ps1
param([string]$backupFile)

Write-Host "Restaurando desde $backupFile..."
pm2 stop provetcare-backend

# Restauración
psql -U postgres -d provetcare_db -f $backupFile

# Verificación
$count = psql -U postgres -d provetcare_db -t -c "SELECT COUNT(*) FROM users"
Write-Host "Usuarios restaurados: $count"

pm2 start provetcare-backend
```

---

## RESUMEN DE CUMPLIMIENTO

| Semana | Indicador Clave | Valor Final | Cumplimiento |
|--------|-----------------|-------------|--------------|
| 1 | Tiempo Respuesta | 420ms | ✅ |
| 2 | Vulnerabilidades Críticas | 0 | ✅ |
| 3 | Coverage Tests | 74% | ✅ |
| 4 | RTO | 45 min | ✅ |
| 5 | Score SUS | 78.5 | ✅ |
| 6 | Uptime | 99.9% | ✅ |

---

**Firma del Estudiante:**  
Oscar Singo
