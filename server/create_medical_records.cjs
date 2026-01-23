const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'provetcare_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function createSampleMedicalRecords() {
    try {
        console.log('🏥 Creando registros médicos de prueba...\n');

        // Obtener mascotas existentes
        const petsRes = await pool.query('SELECT id, name FROM pets ORDER BY id');

        if (petsRes.rows.length === 0) {
            console.log('❌ No hay mascotas en la base de datos');
            return;
        }

        console.log('Mascotas encontradas:', petsRes.rows.length);

        // Obtener un veterinario (admin)
        const vetRes = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        const vetId = vetRes.rows[0]?.id || 1;

        // Crear registros médicos para cada mascota
        for (const pet of petsRes.rows) {
            // Registro médico 1 - Consulta General
            await pool.query(`
                INSERT INTO medical_records 
                (pet_id, vet_id, visit_date, diagnosis, treatment, medications, weight, temperature, notes, veterinarian_name)
                VALUES ($1, $2, CURRENT_DATE - INTERVAL '30 days', $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT DO NOTHING
            `, [
                pet.id,
                vetId,
                'Chequeo general - Estado de salud bueno',
                'Vitaminas y desparasitación',
                'Complejo B, Antiparasitario interno',
                pet.id === 4 ? 28.5 : (pet.id === 10 ? 30.2 : 4.8),
                38.5,
                'Mascota en buen estado general. Se recomienda seguimiento en 3 meses.',
                'Dr. Carlos Administrador'
            ]);

            // Registro médico 2 - Vacunación
            await pool.query(`
                INSERT INTO medical_records 
                (pet_id, vet_id, visit_date, diagnosis, treatment, medications, weight, temperature, notes, veterinarian_name)
                VALUES ($1, $2, CURRENT_DATE - INTERVAL '60 days', $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT DO NOTHING
            `, [
                pet.id,
                vetId,
                'Vacunación anual - Refuerzo',
                'Aplicación de vacuna polivalente',
                'Vacuna Polivalente, Antirrábica',
                pet.id === 4 ? 27.8 : (pet.id === 10 ? 29.5 : 4.5),
                38.3,
                'Vacunación completada sin reacciones adversas. Próxima dosis en 1 año.',
                'Dr. Carlos Administrador'
            ]);

            // Registro médico 3 - Consulta reciente
            await pool.query(`
                INSERT INTO medical_records 
                (pet_id, vet_id, visit_date, diagnosis, treatment, medications, weight, temperature, notes, veterinarian_name)
                VALUES ($1, $2, CURRENT_DATE - INTERVAL '7 days', $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT DO NOTHING
            `, [
                pet.id,
                vetId,
                'Control de rutina',
                'Revisión de peso y temperatura',
                'Ninguno',
                pet.id === 4 ? 29.0 : (pet.id === 10 ? 30.8 : 5.0),
                38.6,
                'Mascota saludable. Peso adecuado para su edad y tamaño.',
                'Dr. Carlos Administrador'
            ]);

            console.log(`✅ Registros creados para: ${pet.name} (ID: ${pet.id})`);
        }

        // Verificar registros creados
        const countRes = await pool.query('SELECT COUNT(*) FROM medical_records');
        console.log(`\n🎉 Total de registros médicos en BD: ${countRes.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createSampleMedicalRecords();
