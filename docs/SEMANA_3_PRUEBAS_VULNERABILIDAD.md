# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  


---

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

---

**Firma del Estudiante:**  
Oscar Singo
