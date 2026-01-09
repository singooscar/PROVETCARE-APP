// Script simple para generar hash de password
// Ejecutar desde el directorio raíz: node generar-hash.js

const bcrypt = require('bcryptjs');

const password = 'password123';

bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('\n🔐 Password Hash Generado:\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n📋 Copia este hash para el SQL:');
    console.log(`'${hash}'`);
    console.log('\n✅ Listo para usar en CREAR_USUARIO_TEST.sql');
});
