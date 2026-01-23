# 📂 Scripts - PROVETCARE

Esta carpeta contiene todos los scripts auxiliares del proyecto, organizados por categoría.

---

## 📁 Estructura

### `sql/` - Scripts SQL
Contiene todos los scripts SQL organizados por función:

- **`setup/`** - Configuración inicial de usuarios y datos de prueba
- **`migrations/`** - Migraciones de base de datos y fixes
- **`utilities/`** - Utilidades para gestión de códigos, usuarios, etc.
- **`verification/`** - Scripts para verificar datos y estado
- **`deployment/`** - Scripts para despliegue y producción
- **`seeds/`** - Datos de prueba (seeders)

### `testing/` - Scripts de Testing
Scripts de prueba para verificar funcionalidades del sistema:
- Tests de login
- Tests de registro de veterinarios
- Tests de citas (dual flow)
- Tests del ecosistema completo

### `utilities/` - Utilidades del Servidor
Herramientas para administración y desarrollo:
- Crear usuarios de prueba
- Generar hashes de contraseñas
- Exportar datos
- Verificar estado de emails
- Listar usuarios
- Ejecutar migraciones

### `monitoring/` - Herramientas de Monitoreo
Dashboards y herramientas de visualización en tiempo real.

---

## 🚀 Uso Rápido

### Scripts SQL

**Configuración inicial:**
```bash
psql -U postgres -d provetcare_db -f scripts/sql/setup/setup-completo-usuarios.sql
```

**Ver usuarios registrados:**
```bash
psql -U postgres -d provetcare_db -f scripts/sql/verification/verificar-usuarios.sql
```

### Scripts de Testing

```bash
cd scripts/testing
node test-login.js
node test-ecosystem.js
```

### Utilidades

```bash
cd scripts/utilities
node crear-usuario-prueba.js
node generar-hash.js
```

---

## 📝 Documentación Detallada

Ver `docs/scripts/` para documentación completa de cada script.
