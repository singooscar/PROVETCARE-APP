# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  


---

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

---

**Firma del Estudiante:**  
Oscar Singo
