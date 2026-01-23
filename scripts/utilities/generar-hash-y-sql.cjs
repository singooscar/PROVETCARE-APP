const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const password = 'admin123';

console.log('🔐 Generando hash y creando archivo SQL...');

bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }

    const sqlContent = `-- ============================================================================
-- ARREGLO FINAL DE LOGIN
-- Hash generado automáticamente por el servidor para 'admin123'
-- ============================================================================

UPDATE users 
SET password = '${hash}'
WHERE email IN ('admin@provetcare.com', 'cliente@example.com');

SELECT '✅ Usuarios actualizados correctamente' as mensaje;
SELECT email, role, left(password, 20) || '...' as hash_inicio FROM users WHERE email IN ('admin@provetcare.com', 'cliente@example.com');
`;

    // Guardar en el directorio raíz (un nivel arriba de server/)
    const filePath = path.join(__dirname, '..', 'FIX_LOGIN_FINAL.sql');

    fs.writeFileSync(filePath, sqlContent);

    console.log(`✅ Archivo creado exitosamente en: ${filePath}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🔒 Hash:     ${hash}`);
});
