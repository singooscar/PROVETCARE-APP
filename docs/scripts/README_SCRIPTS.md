# 📚 Documentación de Scripts SQL - PROVETCARE

Guía completa de todos los scripts SQL disponibles en el proyecto.

---

## 🔧 Setup - Configuración Inicial

### `crear-usuario-test.sql`
Crea un usuario de prueba en el sistema.

**Uso:**
```bash
psql -U postgres -d provetcare_db -f scripts/sql/setup/crear-usuario-test.sql
```

### `setup-completo-usuarios.sql`
Configuración completa de usuarios del sistema (admin + clientes de prueba).

**Incluye:**
- Usuario administrador (veterinario)
- Varios clientes de prueba
- Mascotas asociadas
- Códigos de invitación

### `setup-datos-prueba.sql`
Datos de prueba completos para desarrollo y testing.

---

## 🔄 Migrations - Migraciones

### `ejecutar-migracion-dual-flow.sql`
Migración para implementar flujo dual de citas (cliente + admin).

### `migracion-ecosistema.sql`
Migración del ecosistema completo de códigos de invitación.

### `fix-login-final.sql`
Corrección de problemas de autenticación y login.

### `actualizar-passwords.sql`
Actualiza contraseñas de usuarios existentes con hash bcrypt.

---

## 🛠️ Utilities - Utilidades

### `crear-codigo-manual.sql`
Crea un código de invitación manualmente.

**Ejemplo:**
```sql
-- Genera código: VET2024ABC
```

### `generar-codigo-registro.sql`
Genera códigos de registro para nuevos veterinarios.

### `reactivar-codigo.sql`
Reactiva un código de invitación expirado o usado.

### `obtener-ids.sql`
Obtiene IDs de usuarios, mascotas y citas para debugging.

### `crear-cliente-password-admin.sql`
Crea cliente con contraseña administrativa.

---

## ✅ Verification - Verificación

### `verificar-usuarios.sql`
Lista todos los usuarios del sistema con su información.

**Output:**
```
id | nombre | email | role | activo
```

### `verificar-codigos.sql`
Verifica estado de códigos de invitación.

### `verificar-dual-flow.sql`
Verifica el flujo dual de citas funciona correctamente.

### `verificar-id-mascota.sql`
Obtiene información de una mascota específica por ID.

---

## 🚀 Deployment - Despliegue

### `full-cloud-deploy.sql`
Script completo para despliegue en la nube (producción).

**Incluye:**
- Creación de todas las tablas
- Índices optimizados
- Constraints y triggers
- Usuario administrador inicial

### `ejecutar-en-pgadmin.sql`
Script optimizado para ejecutar en pgAdmin.

### `ejecutar-en-pgadmin-fixed.sql`
Versión corregida del script de pgAdmin.

---

## 🌱 Seeds - Datos de Prueba

### `seed-ecosistema.sql`
Datos completos del ecosistema:
- Usuarios de prueba
- Mascotas
- Citas de ejemplo
- Códigos de invitación

---

## 📖 Ejemplos de Uso

### Configurar Desde Cero

```bash
# 1. Crear base de datos
createdb -U postgres provetcare_db

# 2. Ejecutar script inicial
psql -U postgres -d provetcare_db -f server/database/init.sql

# 3. Agregar datos de prueba
psql -U postgres -d provetcare_db -f scripts/sql/seeds/seed-ecosistema.sql
```

### Verificar Sistema

```bash
# Ver usuarios
psql -U postgres -d provetcare_db -f scripts/sql/verification/verificar-usuarios.sql

# Ver códigos activos
psql -U postgres -d provetcare_db -f scripts/sql/verification/verificar-codigos.sql
```

### Crear Usuario de Prueba

```bash
psql -U postgres -d provetcare_db -f scripts/sql/setup/crear-usuario-test.sql
```

---

## ⚠️ Notas Importantes

- **Siempre hacer backup** antes de ejecutar migraciones
- Los scripts de deployment son para **producción** - usar con precaución
- Los scripts de verificación son **solo lectura** - seguros de ejecutar
- Algunos scripts requieren **privilegios de administrador** de PostgreSQL

---

## 🔗 Ver También

- [Documentación de Scripts](../scripts/README.md)
- [Guía de Ejecución Local](../guias/GUIA_EJECUCION_LOCAL.md)
- [README Principal](../../README.md)
