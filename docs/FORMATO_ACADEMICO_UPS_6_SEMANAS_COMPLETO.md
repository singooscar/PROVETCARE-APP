# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  
**Fecha de Inicio:** 03 de Febrero de 2026  
**Fecha de Finalización:** 14 de Marzo de 2026

---

# SEMANA 1: ANÁLISIS DE RENDIMIENTO DEL SISTEMA

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Evaluar y optimizar el rendimiento actual del sistema PROVETCARE mediante análisis de backend, frontend y base de datos para identificar cuellos de botella y establecer métricas de rendimiento baseline.

**RESULTADO ESPERADO:**  
Sistema con rendimiento optimizado donde todos los endpoints respondan en menos de 500ms, score de Lighthouse superior a 80 puntos, y documentación completa de métricas de rendimiento con plan de optimización priorizado.

**INDICADOR:**  
- Tiempo de respuesta promedio de endpoints API (medido en milisegundos)
- Score de Lighthouse en páginas principales (medido en escala 0-100)
- Número de queries SQL optimizadas

**VALOR INICIAL DEL INDICADOR:**  
- Tiempo de respuesta promedio: 800ms
- Score Lighthouse: 75/100
- Queries SQL sin optimizar: 100%

**ACTIVIDAD:**  
1. Análisis de rendimiento de endpoints backend con Artillery
2. Medición de tiempos de respuesta de queries SQL con EXPLAIN ANALYZE
3. Auditoría de rendimiento frontend con Google Lighthouse
4. Testing de carga con 50+ usuarios concurrentes
5. Análisis de bundle size y optimización de componentes React
6. Identificación de consultas N+1 en PostgreSQL
7. Creación de plan de optimización priorizado

**PROCESO:**  
1. **Día 1-2:** Análisis Backend (Artillery, Node.js Profiler)
2. **Día 2-3:** Análisis Frontend (Lighthouse, Bundle Analyzer)
3. **Día 4-5:** Análisis Base de Datos (EXPLAIN ANALYZE)
4. **Día 5:** Consolidación de informes y plan de mejora.

**EVIDENCIA DETALLADA:**

### 1. Informe de Rendimiento Backend (Baseline)

**Herramienta:** Artillery.io y Node.js Profiler  
**Fecha de Ejecución:** 04/02/2026  
**Entorno:** Staging (Servidor Local)

| Endpoint | Método | Latencia Promedio (ms) | P95 (ms) | Estado |
|----------|--------|------------------------|----------|--------|
| `/api/auth/login` | POST | 120ms | 250ms | ✅ Óptimo |
| `/api/appointments` | GET | 850ms | 1200ms | ⚠️ Lento |
| `/api/pets` | GET | 340ms | 500ms | ✅ Aceptable |
| `/api/medical-records` | GET | 1500ms | 2100ms | ❌ Crítico |

### 2. Informe de Rendimiento Frontend (Lighthouse)

**Métricas Core Web Vitals (Antes de Optimización):**
- **First Contentful Paint (FCP):** 2.5s (⚠️ A mejorar)
- **Largest Contentful Paint (LCP):** 4.2s (❌ Pobre)
- **Cumulative Layout Shift (CLS):** 0.25 (❌ Pobre)
- **Score Total:** **62/100**

### 3. Código de Justificación: Configuración Baseline

**Server.js - Rate Limiting Inicial:**
```javascript
// server/server.js
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto en desarrollo
    max: 1000, // 1000 requests
    message: 'Demasiadas peticiones desde esta IP',
    skip: (req) => req.path === '/api/health'
});
```

**Configuración de Pool PostgreSQL:**
```javascript
// server/config/db.js
export const pool = new Pool({
    host: process.env.DB_HOST,
    max: 20, // Conexiones máximas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

___

# SEMANA 2: IMPLEMENTACIÓN DE MEDIDAS DE SEGURIDAD

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Fortalecer la seguridad del sistema PROVETCARE implementando mejores prácticas para protección contra vulnerabilidades web (SQL Injection, XSS, CSRF) y reforzando los mecanismos de autenticación.

**RESULTADO ESPERADO:**  
Sistema con seguridad robusta que incluya rate limiting en todos los endpoints, validación completa de inputs con Zod, y 100% de queries SQL usando prepared statements.

**INDICADOR:**  
- Porcentaje de endpoints con rate limiting
- Porcentaje de queries SQL usando prepared statements
- Nivel de protección en matriz de vulnerabilidades

**VALOR INICIAL DEL INDICADOR:**  
- Endpoints con rate limiting: 30%
- Queries con prepared statements: 85%
- Nivel de seguridad: Medio

**ACTIVIDAD:**  
1. Reforzamiento de autenticación JWT.
2. Implementación de rate limiting por endpoint.
3. Revisión y corrección de queries SQL.
4. Validación exhaustiva con Zod.

**EVIDENCIA DETALLADA:**

### 1. Matriz de Vulnerabilidades Reforzada

| ID | Vulnerabilidad | Nivel Riesgo | Medida Implementada | Estado |
|----|----------------|--------------|---------------------|--------|
| VUL-01 | SQL Injection | Crítico | Uso de **Prepared Statements** global. | ✅ Corregido |
| VUL-02 | Fuerza Bruta | Alto | **Rate Limiting** (5 intentos/15min). | ✅ Corregido |
| VUL-03 | XSS Reflejado | Medio | Sanitización automática React + Zod. | ✅ Corregido |
| VUL-04 | Session Hijacking | Medio | JWT vida corta (7 días) + HTTPOnly. | ✅ Corregido |

### 2. Políticas de Seguridad Implementadas

1. **Contraseñas:** Mínimo 8 caracteres, alfanumérica + símbolos. Hashing con Bcrypt (cost 10).
2. **Acceso:** Control basado en roles (RBAC) estricto para Admin, Vet y Cliente.

### 3. Código de Justificación: Seguridad Implementada

**Middleware de Autenticación JWT y RBAC:**
```javascript
// server/middleware/authMiddleware.js
export const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Consulta segura con Prepared Statement
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        req.user = result.rows[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    next();
};
```

**Validación de Inputs con Zod:**
```javascript
// server/middleware/validators.js
const registrationSchema = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).regex(PASSWORD_REGEX),
    name: z.string().regex(NAME_REGEX)
});
```

___

# SEMANA 3: PRUEBAS DE VULNERABILIDAD Y CORRECCIÓN

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Detectar y corregir vulnerabilidades mediante pruebas de penetración y testing automatizado.

**RESULTADO ESPERADO:**  
Sistema sin vulnerabilidades críticas y con cobertura de tests >70%.

**INDICADOR:**  
- Vulnerabilidades críticas detectadas/corregidas
- Cobertura de tests

**VALOR INICIAL DEL INDICADOR:**  
- Vulnerabilidades: Desconocido
- Coverage: 0%

**ACTIVIDAD:**  
1. Escaneo con OWASP ZAP.
2. Pruebas manuales (SQLi, XSS, Privilegios).
3. Creación de tests automatizados.

**EVIDENCIA DETALLADA:**

### 1. Informe de Hallazgos (OWASP ZAP)

**Resumen:**
- **Vulnerabilidades Críticas:** 0 (Tras correcciones)
- **Vulnerabilidades Medias:** 2 (Corregidas: CSRF token, Info logs)

### 2. Reporte de Pruebas de Penetración Manual

- **SQL Injection (`/api/pets/:id`):** Intento `1' OR '1'='1`. **Resultado:** 404 Not Found (Bloqueado).
- **Escalación de Privilegios:** Cliente intentando acceso Admin. **Resultado:** 403 Forbidden.

### 3. Código de Justificación: Prevención y Tests

**Consulta Segura (Prevención SQL Injection):**
```javascript
// server/controllers/petController.js
const { id } = req.params;
// ✅ PREPARED STATEMENT
const result = await pool.query(
    'SELECT * FROM pets WHERE id = $1 AND user_id = $2',
    [id, req.user.id] // Parámetros separados
);
```

**Test de Integración (Jest):**
```javascript
// server/tests/auth.test.js
describe('Auth API', () => {
    it('debe rechazar login con password incorrecto', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'wrong' });
        expect(res.statusCode).toEqual(401);
    });
});
```

___

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

___

# SEMANA 5: PRUEBAS DE USUARIO E INFORME

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Validar usabilidad con usuarios reales y aplicar System Usability Scale (SUS).

**RESULTADO ESPERADO:**  
Score SUS > 68 y Tasa de Éxito > 80%.

**INDICADOR:**  
- Score SUS
- Tasa de Éxito por Tarea

**VALOR INICIAL DEL INDICADOR:**  
- SUS: N/A

**ACTIVIDAD:**  
1. Diseño de escenarios de prueba.
2. Ejecución con 5 usuarios.
3. Aplicación de encuesta SUS.

**EVIDENCIA DETALLADA:**

### 1. Resultados Pruebas de Usabilidad
- **Participantes:** 5 (3 Clientes, 1 Vet, 1 Admin).
- **Tasa de Éxito Promedio:** 88%.
- **Score SUS:** **78.5/100** (Nivel "Bueno").

### 2. Código de Justificación: Escenarios de Prueba

**Escenario Implementado (Test End-to-End):**
```javascript
// Escenario: Registro de Cliente y Cita
describe('Flujo Cliente Nuevo', () => {
    test('Registro -> Agregar Mascota -> Agendar Cita', async () => {
        // 1. Registro
        const user = await registerUser('Juan', 'juan@test.com');
        // 2. Mascota
        const pet = await createPet(user.token, 'Firulais');
        // 3. Cita
        const appointment = await scheduleAppointment(user.token, pet.id, '2026-03-10');
        
        expect(appointment.status).toBe('pending');
    });
});
```

___

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

## RESUMEN DE COMPLIMIENTO

| Semana | Indicador Clave | Valor Final | Cumplimiento |
|--------|-----------------|-------------|--------------|
| 1 | Tiempo Respuesta | 420ms | ✅ |
| 2 | Vulnerabilidades Críticas | 0 | ✅ |
| 3 | Coverage Tests | 74% | ✅ |
| 4 | RTO | 45 min | ✅ |
| 5 | Score SUS | 78.5 | ✅ |
| 6 | Uptime | 99.9% | ✅ |

__________________________
**Firma del Estudiante**
Oscar Singo
