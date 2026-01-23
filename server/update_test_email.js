// Script para actualizar email del usuario de prueba
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function updateTestEmail() {
    try {
        console.log('🔄 Actualizando email del usuario de prueba...\n');

        // Actualizar email
        const updateResult = await pool.query(
            `UPDATE users 
             SET email = $1 
             WHERE email = $2
             RETURNING *`,
            ['oscarsingo2004@gmail.com', 'juan.perez@email.com']
        );

        if (updateResult.rows.length > 0) {
            console.log('✅ Email actualizado exitosamente:\n');
            const user = updateResult.rows[0];
            console.log(`   ID: ${user.id}`);
            console.log(`   Nombre: ${user.full_name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Rol: ${user.role}`);
            console.log(`\n📧 Ahora puedes iniciar sesión con:`);
            console.log(`   Email: oscarsingo2004@gmail.com`);
            console.log(`   Password: cliente123`);
        } else {
            console.log('⚠️  No se encontró el usuario juan.perez@email.com');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateTestEmail();
