# 🛠️ Tools - PROVETCARE

Herramientas de desarrollo para facilitar el trabajo con PROVETCARE.

---

## 📜 Scripts Disponibles

### `iniciar-desarrollo.ps1`
Inicia automáticamente el backend y frontend en terminales separadas.

**Uso:**
```powershell
.\tools\iniciar-desarrollo.ps1
```

**Funciones:**
- ✅ Verifica Node.js y PostgreSQL
- ✅ Inicia el servidor backend (puerto 5000)
- ✅ Inicia el servidor frontend (puerto 5173)
- ✅ Abre el navegador automáticamente

---

### `verificar-sistema.ps1`
Diagnóstico completo del sistema y servicios.

**Uso:**
```powershell
.\tools\verificar-sistema.ps1
```

**Verifica:**
- ✅ Node.js y npm instalados
- ✅ PostgreSQL corriendo
- ✅ Backend activo (puerto 5000)
- ✅ Frontend activo (puerto 5173)
- ✅ Dependencias instaladas
- ✅ Archivo .env configurado
- ✅ Base de datos disponible

**Output:**
```
[1] Verificando Node.js...
   OK Node.js v20.19.6
[2] Verificando npm...
   OK npm 10.8.2
...
EXITO - PROVETCARE esta completamente operativo!
```

---

## 🚀 Workflow Recomendado

### 1. Verificar Estado del Sistema
```powershell
.\tools\verificar-sistema.ps1
```

### 2. Iniciar Desarrollo
```powershell
.\tools\iniciar-desarrollo.ps1
```

### 3. Acceder a la Aplicación
Abre tu navegador en: http://localhost:5173

---

## ⚙️ Requisitos

- **PowerShell 5.1+**
- **Node.js 18+**
- **PostgreSQL 14+**
- Permisos de ejecución de scripts PowerShell

---

## 🔧 Solución de Problemas

### Error: "No se puede ejecutar scripts en este sistema"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Los servicios no inician

Verifica que los puertos 5000 y 5173 estén libres:
```powershell
netstat -ano | findstr ":5000"
netstat -ano | findstr ":5173"
```

---

**💡 Tip:** Ejecuta `verificar-sistema.ps1` regularmente para asegurar que todo esté funcionando correctamente.
