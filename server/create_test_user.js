// Script para crear un nuevo usuario de prueba
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function createTestUser() {
    try {
        console.log('🔄 Creando nuevo usuario de prueba...\n');

        // Datos del nuevo usuario
        const userData = {
            fullName: 'Usuario Ecosistemas',
            email: 'ecosistemasexamen@gmail.com',
            password: 'password123', // Contraseña simple para pruebas
            phone: '0999999999',
            address: 'Dirección de prueba',
            role: 'client'
        };

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Insertar usuario en la base de datos
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, phone, address, role, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             RETURNING id, full_name, email, phone, role, created_at`,
            [userData.fullName, userData.email, hashedPassword, userData.phone, userData.address, userData.role]
        );

        const newUser = result.rows[0];

        console.log('✅ Usuario creado exitosamente:\n');
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Nombre: ${newUser.full_name}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Teléfono: ${newUser.phone}`);
        console.log(`   Rol: ${newUser.role}`);
        console.log(`   Creado: ${newUser.created_at}`);
        console.log('\n📧 Credenciales para iniciar sesión:');
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log('\n🎯 Este usuario recibirá correos en: ecosistemasexamen@gmail.com');

    } catch (error) {
        if (error.code === '23505') {
            console.error('❌ Error: El email ya existe en la base de datos');
            console.log('\n💡 Si quieres usar este email, primero elimina el usuario existente');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await pool.end();
    }
}

createTestUser();
