# 🔧 Instrucciones de Instalación - Sistema de Registro de Veterinarios

## Paso 1: Ejecutar Migración de Base de Datos

La tabla `invitation_codes` necesita ser creada en PostgreSQL.

### Opción A: Usar pgAdmin (Recomendado)

1. Abrir pgAdmin
2. Conectar a la base de datos `provetcare_db`
3. Click derecho en `provetcare_db` → "Query Tool"
4. Abrir el archivo: `server/database/migrations/001_add_invitation_codes.sql`
5. Ejecutar el script completo (botón "Execute/Refresh" o F5)
6. Verificar en la salida que dice "invitation_codes table created"

### Opción B: Línea de Comandos (PostgreSQL CLI)

**Windows (PowerShell):**
```powershell
cd C:\Users\oscar\OneDrive\Escritorio\PROVETCAREE\server
& "C:\Program Files\PostgreSQL\<VERSION>\bin\psql.exe" -U postgres -d provetcare_db -f database/migrations/001_add_invitation_codes.sql
```

Reemplaza `<VERSION>` con tu versión de PostgreSQL (ej: 14, 15, 16)

---

## Paso 2: Verificar la Instalación

Ejecuta esta consulta en pgAdmin o psql:

```sql
SELECT 
    code, 
    is_used, 
    expires_at, 
    created_at
FROM invitation_codes 
WHERE code = 'bootstrap-admin-2026-provetcare';
```

**Resultado Esperado:**
- Debe retornar 1 fila
- `code`: "bootstrap-admin-2026-provetcare"
- `is_used`: FALSE
- `expires_at`: Fecha 30 días en el futuro

---

## Paso 3: Reiniciar el Servidor (Opcional)

Si el servidor ya estaba corriendo, no es necesario reiniciarlo. Los cambios en el código ya están activos.

---

## 🎯 Nuevos Endpoints Disponibles

### 1. Generar Código de Invitación (Solo Admins)
```
POST /api/auth/invitation-codes
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Código de invitación generado exitosamente",
  "data": {
    "code": "d82f3c1a-4b5d-4e3a-9c8e-1f7a5b2d8c9e",
    "expiresAt": "2026-01-15T22:30:00.000Z",
    "createdAt": "2026-01-08T22:30:00.000Z",
    "validFor": "7 días"
  }
}
```

---

### 2. Registrar Veterinario
```
POST /api/auth/register-admin
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Dr. Juan Veterinario",
  "email": "dr.juan@provetcare.com",
  "password": "SecureVet@123",
  "phone": "+51987654321",
  "invitationCode": "bootstrap-admin-2026-provetcare"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cuenta de veterinario creada exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 5,
      "name": "Dr. Juan Veterinario",
      "email": "dr.juan@provetcare.com",
      "phone": "+51987654321",
      "role": "admin",
      "createdAt": "2026-01-08T22:35:00.000Z"
    }
  }
}
```

---

## 🔒 Seguridad Implementada

✅ **Códigos UUID v4** - Imposible de adivinar (2^122 posibilidades)  
✅ **Expiración Automática** - 7 días de validez  
✅ **Uso Único** - Un código solo sirve para un registro  
✅ **Solo Admins Generan** - Verificación de rol en middleware  
✅ **Mensajes Genéricos** - No revela si código existe/usado/expirado  
✅ **Timing-Safe** - Respuestas de ~200ms mínimo  
✅ **Bcrypt Cost Factor 12** - Mismo nivel de seguridad que clientes  
✅ **Audit Trail** - Registra quién creó y usó cada código  

---

## 📊 Estructura de la Tabla invitation_codes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `code` | VARCHAR(64) | UUID del código (UNIQUE) |
| `created_by` | INTEGER | ID del admin que lo generó |
| `used_by` | INTEGER | ID del usuario que lo usó |
| `is_used` | BOOLEAN | Flag de uso rápido |
| `expires_at` | TIMESTAMP | Fecha de expiración |
| `created_at` | TIMESTAMP | Fecha de creación |
| `used_at` | TIMESTAMP | Fecha de uso |

---

## 🧪 Casos de Prueba

### Test 1: Código Bootstrap (Primera Vez)
```bash
# Usar el código bootstrap para crear primer veterinario
POST /api/auth/register-admin
{
  "name": "Dr. Primer Veterinario",
  "email": "vet1@provetcare.com",
  "password": "SecureVet@123",
  "invitationCode": "bootstrap-admin-2026-provetcare"
}

# Esperado: 201 Created, role='admin'
```

### Test 2: Generar Nuevo Código (Como Admin)
```bash
# Primero login como admin
POST /api/auth/login
{
  "email": "admin@provetcare.com",
  "password": "admin123"
}

# Luego generar código
POST /api/auth/invitation-codes
Authorization: Bearer <token>

# Esperado: 201 Created con UUID nuevo
```

### Test 3: Código Inválido
```bash
POST /api/auth/register-admin
{
  "name": "Test",
  "email": "test@test.com",
  "password": "SecureP@ss123",
  "invitationCode": "codigo-falso-12345"
}

# Esperado: 400 "Código de invitación inválido o expirado"
```

### Test 4: Código Ya Usado
```bash
# Intentar usar el mismo código bootstrap dos veces
POST /api/auth/register-admin
{
  "invitationCode": "bootstrap-admin-2026-provetcare"
}

# Esperado: 400 "Código de invitación inválido o expirado"
```

---

## ✅ Checklist de Verificación

- [ ] Tabla `invitation_codes` creada en PostgreSQL
- [ ] Código bootstrap aparece en la tabla
- [ ] Servidor corriendo sin errores
- [ ] Endpoint `/api/auth/register-admin` responde
- [ ] Endpoint `/api/auth/invitation-codes` requiere admin
- [ ] Validación de invitationCode funciona
- [ ] Usuario creado tiene role='admin'

---

## 🚨 Troubleshooting

**Error: "relation invitation_codes does not exist"**
- Solución: Ejecutar la migración SQL en pgAdmin

**Error: "duplicate key value violates unique constraint"**
- Solución: El código bootstrap ya existe, usar otro código o generar uno nuevo

**Error: "column invitationCode does not exist"**  
- Solución: Reiniciar el servidor Node.js para cargar los nuevos validators

**Error: "No tienes permisos para generar códigos"**
- Solución: Asegúrate de estar autenticado como admin (`role='admin'`)

---

## 📁 Archivos Modificados/Creados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `server/database/migrations/001_add_invitation_codes.sql` | NUEVO | Migración de BD |
| `server/middleware/validators.js` | MODIFICADO | +registerAdminSchema |
| `server/controllers/authController.js` | MODIFICADO | +registerAdmin, +generateInvitationCode |
| `server/routes/authRoutes.js` | MODIFICADO | +2 rutas nuevas |

---

**Siguiente Paso:** Después de ejecutar la migración, puedes probar el sistema con las pruebas arriba mencionadas.
