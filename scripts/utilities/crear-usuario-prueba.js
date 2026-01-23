/**
 * Script para crear usuario cliente de prueba con password correcto
 * Ejecutar: node crear-usuario-prueba.js
 */

import bcrypt from 'bcrypt';
import { pool } from './server/config/db.js';

async function crearUsuarioPrueba() {
    try {
        console.log('🔐 Creando usuario de prueba...\n');

        // Hashear el password correctamente
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log(`✅ Password hasheado: ${hashedPassword.substring(0, 30)}...`);

        // Verificar si ya existe
        const checkUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            ['cliente@example.com']
        );

        if (checkUser.rows.length > 0) {
            // Actualizar password del usuario existente
            await pool.query(
                'UPDATE users SET password = $1 WHERE email = $2',
                [hashedPassword, 'cliente@example.com']
            );
            console.log('✅ Usuario existente actualizado con nuevo password');
        } else {
            // Crear nuevo usuario
            const result = await pool.query(
                `INSERT INTO users (full_name, email, phone, password, role, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                 RETURNING id, full_name, email, role`,
                ['Cliente de Prueba', 'cliente@example.com', '555-0001', hashedPassword, 'client']
            );
            console.log('✅ Nuevo usuario creado:');
            console.log(result.rows[0]);
        }

        // Verificar si tiene mascota
        const userId = checkUser.rows.length > 0
            ? checkUser.rows[0].id
            : (await pool.query('SELECT id FROM users WHERE email = $1', ['cliente@example.com'])).rows[0].id;

        const checkPet = await pool.query(
            'SELECT id FROM pets WHERE owner_id = $1',
            [userId]
        );

        if (checkPet.rows.length === 0) {
            // Crear mascota de prueba
            const petResult = await pool.query(
                `INSERT INTO pets (name, species, breed, owner_id, created_at)
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                 RETURNING id, name, species`,
                ['Max', 'Perro', 'Labrador', userId]
            );
            console.log('✅ Mascota creada:');
            console.log(petResult.rows[0]);
        } else {
            console.log('✅ Usuario ya tiene mascota');
        }

        console.log('\n📋 CREDENCIALES DE PRUEBA:');
        console.log('   Email: cliente@example.com');
        console.log('   Password: password123');
        console.log('\n✅ Usuario listo para pruebas');
        console.log('▶️  Ejecuta: node test-dual-flow-appointments.js');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

crearUsuarioPrueba();
