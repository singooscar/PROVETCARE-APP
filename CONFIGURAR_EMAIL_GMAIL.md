# 🔐 Configurar Gmail para Enviar Emails desde PROVETCARE

## Problema
Gmail bloqueó el intento de envío porque la contraseña en `.env` no es válida o Gmail requiere "Contraseña de Aplicación".

## ✅ Solución: Generar Contraseña de Aplicación de Gmail

### Paso 1: Verificar Autenticación en Dos Pasos
1. Ve a: https://myaccount.google.com/security
2. Busca "Verificación en dos pasos"
3. Si NO está activada, **actívala primero**

### Paso 2: Generar Contraseña de Aplicación
1. Ve a: **https://myaccount.google.com/apppasswords**
2. Si te pide iniciar sesión, ingresa con `oscarsingo2004@gmail.com`
3. En "Seleccionar app" → Elige **"Correo"**
4. En "Seleccionar dispositivo" → Elige **"Otro (nombre personalizado)"**
5. Escribe: **"PROVETCARE"**
6. Click en **"Generar"**
7. Gmail te mostrará una contraseña de 16 caracteres (ejemplo: `abcd efgh ijkl mnop`)

### Paso 3: Actualizar `.env`
1. Copia la contraseña generada (los 16 caracteres, SIN espacios)
2. Abre el archivo `.env` en `server/.env`
3. Reemplaza la línea:
   ```
   EMAIL_PASSWORD=sfgrqyifwuhpssxz
   ```
   Con:
   ```
   EMAIL_PASSWORD=tu_nueva_contraseña_de_16_caracteres
   ```
4. Guarda el archivo

### Paso 4: Probar de nuevo
Ejecuta en PowerShell:
```powershell
cd server
node test-email.js
```

---

## 🚨 Si NO puedes generar contraseña de aplicación:

**Opción alternativa (menos segura, no recomendada):**
1. Ve a: https://myaccount.google.com/lesssecureapps
2. Activa "Permitir aplicaciones menos seguras"
3. Vuelve a ejecutar `node test-email.js`

---

## 📋 Notas
- La contraseña de aplicación es **DIFERENTE** a tu contraseña normal de Gmail
- Solo se muestra UNA VEZ cuando la generas
- Si la pierdes, debes generar una nueva
- Es más segura que permitir "aplicaciones menos seguras"
