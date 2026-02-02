# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  


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

---

**Firma del Estudiante:**  
Oscar Singo
