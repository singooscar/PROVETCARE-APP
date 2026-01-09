# 🚀 Guía Rápida de Ejecución - Sistema de Veterinarios

## Paso 1: Ejecutar Migración SQL (MANUAL - pgAdmin)

### Instrucciones:

1. **Abrir pgAdmin**
2. **Conectar a PostgreSQL** (localhost)
3. **Seleccionar base de datos**: `provetcare_db`
4. **Abrir Query Tool** (Click derecho → Query Tool)
5. **Copiar y Pegar este SQL:**

```sql
-- Crear tabla invitation_codes
CREATE TABLE IF NOT EXISTS invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

-- índices
CREATE INDEX IF NOT EXISTS idx_invitation_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_unused ON invitation_codes(is_used, expires_at);

-- Código bootstrap
INSERT INTO invitation_codes (code, created_by, expires_at)
VALUES (
    'bootstrap-admin-2026-provetcare', 
    1,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
) ON CONFLICT (code) DO NOTHING;

-- Verificar
SELECT 
    'Tabla creada exitosamente!' as status,
    code,
    expires_at,
    is_used
FROM invitation_codes;
```

6. **Ejecutar** (botón ▶ o F5)
7. **Verificar** que aparezca "Tabla creada exitosamente!" y el código bootstrap

---

## Paso 2: Probar Generación de Código (Como Admin)

### Opción A: Login como Admin Existente

1. **Login** (obtener token):

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@provetcare.com",
  "password": "admin123"
}
```

2. **Generar Código de Invitación**:

```bash
POST http://localhost:5000/api/auth/invitation-codes
Authorization: Bearer <tu_token_aquí>
Content-Type: application/json
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Código de invitación generado exitosamente",
  "data": {
    "code": "a1b2c3d4-5e6f-4g7h-8i9j-0k1l2m3n4o5p",
    "expiresAt": "2026-01-15T...",
    "validFor": "7 días"
  }
}
```

---

## Paso 3: Registrar Veterinario con Código

```bash
POST http://localhost:5000/api/auth/register-admin
Content-Type: application/json

{
  "name": "Dr. Juan Veterinario",
  "email": "dr.juan@provetcare.com",
  "password": "SecureVet@123",
  "phone": "+51987654321",
  "invitationCode": "bootstrap-admin-2026-provetcare"
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Cuenta de veterinario creada exitosamente",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 5,
      "name": "Dr. Juan Veterinario",
      "email": "dr.juan@provetcare.com",
      "role": "admin"  ← IMPORTANTE: role es 'admin'
    }
  }
}
```

---

## ✅ Checklist de Éxito

- [ ] Tabla `invitation_codes` creada
- [ ] Código bootstrap visible en la tabla
- [ ] Login como admin exitoso
- [ ] Generación de código nuevo funciona
- [ ] Registro de veterinario con código exitoso
- [ ] Usuario creado tiene `role='admin'`

---

## 🧪 Pruebas Adicionales

### Test 1: Código Inválido
```json
{
  "invitationCode": "codigo-falso-123"
}
```
Esperado: `400 "Código de invitación inválido o expirado"`

### Test 2: Código Ya Usado
Intentar usar el mismo código 2 veces
Esperado: `400 "Código de invitación inválido o expirado"`

### Test 3: Cliente Intenta Generar Código
Login como cliente → intentar generar código
Esperado: `403 Forbidden`

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| "relation invitation_codes does not exist" | Ejecutar migración SQL en pgAdmin |
| "Código de invitación inválido" | Verificar que el código existe y no esté usado |
| "No tienes permisos" | Asegurarte de estar logueado como admin |
| "Credenciales inválidas" | Verificar email/password del admin |

---

**Estado Backend:** ✅ Listo (servidor corriendo)  
**Estado Frontend:** ⏳ Pendiente (próxima fase)  
**Siguiente:** Formulario de registro para veterinarios en React
