import pg from 'pg';
const { Pool } = pg;

// Configuración directa para evitar problemas de imports/env
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'provetcare_db',
    password: '2411567', // Contraseña obtenida del .env
    port: 5432,
});

async function checkData() {
    try {
        console.log('🔍 VERIFICANDO DATOS EN BD...');

        // 1. Verificar Usuario
        const email = 'vero@gmail.com';
        const userRes = await pool.query('SELECT id, email, role, created_at FROM users WHERE email = $1', [email]);

        if (userRes.rows.length > 0) {
            console.log(`❌ EL USUARIO YA EXISTE:`);
            console.table(userRes.rows[0]);
        } else {
            console.log(`✅ El email ${email} ESTÁ DISPONIBLE.`);
        }

        // 2. Verificar Código
        const code = 'VET2026';
        const codeRes = await pool.query('SELECT * FROM invitation_codes WHERE code = $1', [code]);

        if (codeRes.rows.length > 0) {
            const c = codeRes.rows[0];
            console.log(`\nℹ️ ESTADO DEL CÓDIGO ${code}:`);
            console.log(`   - Usado: ${c.is_used}`);
            console.log(`   - Expira: ${c.expires_at}`);
        } else {
            console.log(`❌ EL CÓDIGO ${code} NO EXISTE.`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

checkData();
