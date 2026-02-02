# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  


---

# SEMANA 4: COPIAS DE RESPALDO Y MONITOREO

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Implementar sistema de backups automatizados y monitoreo continuo.

**RESULTADO ESPERADO:**  
Backups diarios automáticos, RTO < 1 hora y monitoreo 24/7.

**INDICADOR:**  
- RTO (Tiempo de Recuperación)
- Uptime del sistema

**VALOR INICIAL DEL INDICADOR:**  
- Backups: Manuales
- RTO: N/A

**ACTIVIDAD:**  
1. Scripts PowerShell de Backup/Restore.
2. Configuración PM2 y Alertas.
3. Plan de DRP.

**EVIDENCIA DETALLADA:**

### 1. Plan de Recuperación ante Desastres (DRP)
- **RTO:** 60 minutos.
- **RPO:** 24 horas.
- **Estrategia:** Backups diarios locales + copia semanal offsite.

### 2. Código de Justificación: Automatización

**Script de Backup Automatizado (PowerShell):**
```powershell
# server/scripts/backup-database.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "C:\backups\provetcare\db_$timestamp.sql"

# Dump de base de datos
pg_dump -U postgres -d provetcare_db -F p -f $backupFile

# Verificación de integridad (MD5)
$hash = Get-FileHash -Path $backupFile -Algorithm MD5
$hash.Hash | Out-File "$backupFile.md5"

# Notificación
Send-MailMessage -To "admin@provetcare.com" -Subject "Backup OK" -Body "Guardado en $backupFile"
```

**Configuración Monitor PM2:**
```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'provetcare-backend',
        script: './server/server.js',
        instances: 2,
        max_restarts: 10,
        env: { NODE_ENV: 'production' }
    }]
};
```

---

**Firma del Estudiante:**  
Oscar Singo
