// Ejecutar desde server: cd server && node ../generar-hash-bcrypt.cjs
const bcrypt = require('bcryptjs');

const password = 'admin123';

console.log('\n🔐 Generando hash con bcryptjs...\n');

bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }

    console.log('✅ Hash generado exitosamente');
    console.log('━'.repeat(70));
    console.log(`Password original: ${password}`);
    console.log(`Hash bcryptjs:     ${hash}`);
    console.log('━'.repeat(70));
    console.log('\n📋 SQL para actualizar ambos usuarios:\n');
    console.log(`UPDATE users SET password = '${hash}' WHERE email IN ('admin@provetcare.com', 'cliente@example.com');\n`);
    console.log('✅ Copia y ejecuta el SQL arriba en pgAdmin\n');
});
