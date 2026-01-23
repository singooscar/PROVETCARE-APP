// Script para crear usuario de prueba con contraseña conocida
// Ejecutar con: node create_test_user_offline.cjs

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2411567',
    database: 'provetcare_db'
});

async function createTestUser() {
    try {
        console.log('🔐 Creando usuario de prueba...\n');

        // Contraseña de prueba: prueba123
        const password = 'prueba123';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear usuario cliente de prueba
        const clientResult = await pool.query(`
            INSERT INTO users (full_name, email, password, phone, role)
            VALUES ('Juan Perez Prueba', 'juan.perez@test.com', $1, '555-1234', 'client')
            ON CONFLICT (email) DO UPDATE SET password = $1
            RETURNING id, email, full_name, role
        `, [hashedPassword]);

        console.log('✅ Usuario CLIENTE creado/actualizado:');
        console.log('   Email: juan.perez@test.com');
        console.log('   Contraseña: prueba123');
        console.log('   Rol:', clientResult.rows[0].role);
        console.log('');

        // Crear usuario admin de prueba
        const adminResult = await pool.query(`
            INSERT INTO users (full_name, email, password, phone, role)
            VALUES ('Dr. Admin Prueba', 'admin.prueba@test.com', $1, '555-0000', 'admin')
            ON CONFLICT (email) DO UPDATE SET password = $1
            RETURNING id, email, full_name, role
        `, [hashedPassword]);

        console.log('✅ Usuario ADMIN creado/actualizado:');
        console.log('   Email: admin.prueba@test.com');
        console.log('   Contraseña: prueba123');
        console.log('   Rol:', adminResult.rows[0].role);
        console.log('');

        // Verificar mascota para el cliente
        const petCheck = await pool.query(`
            SELECT id, name FROM pets WHERE owner_id = $1
        `, [clientResult.rows[0].id]);

        if (petCheck.rows.length === 0) {
            // Crear mascota de prueba
            await pool.query(`
                INSERT INTO pets (owner_id, name, species, breed, age, weight, gender, notes)
                VALUES ($1, 'Firulais', 'Perro', 'Mestizo', 3, 12.5, 'macho', 'Mascota de prueba')
            `, [clientResult.rows[0].id]);
            console.log('🐕 Mascota de prueba creada: Firulais');
        } else {
            console.log('🐕 Mascota existente:', petCheck.rows[0].name);
        }

        console.log('\n========================================');
        console.log('🎉 USUARIOS DE PRUEBA LISTOS');
        console.log('========================================');
        console.log('\nPuedes usar cualquiera de estos para login:\n');
        console.log('📧 Cliente: juan.perez@test.com / prueba123');
        console.log('📧 Admin:   admin.prueba@test.com / prueba123');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createTestUser();
