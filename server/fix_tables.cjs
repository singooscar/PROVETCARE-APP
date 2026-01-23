const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function recreateTables() {
    try {
        console.log('🔧 Recreando tablas de recetas...\n');

        // Drop tables
        await pool.query('DROP TABLE IF EXISTS prescription_items CASCADE');
        await pool.query('DROP TABLE IF EXISTS prescriptions CASCADE');
        console.log('✅ Tablas antiguas eliminadas\n');

        // Create prescriptions table
        await pool.query(`
            CREATE TABLE prescriptions (
                id SERIAL PRIMARY KEY,
                appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
                pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
                vet_id INTEGER NOT NULL REFERENCES users(id),
                instructions TEXT,
                pdf_url TEXT,
                status VARCHAR(20) DEFAULT 'issued',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla prescriptions creada');

        // Create prescription_items table
        await pool.query(`
            CREATE TABLE prescription_items (
                id SERIAL PRIMARY KEY,
                prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
                inventory_item_id INTEGER,
                medication_name VARCHAR(255) NOT NULL,
                dosage VARCHAR(100),
                duration VARCHAR(100),
                quantity INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla prescription_items creada\n');

        console.log('═══════════════════════════════════════');
        console.log('✅ Tablas recreadas correctamente');
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

recreateTables();
