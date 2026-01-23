const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function main() {
    try {
        console.log('🔗 Conectando a la base de datos...');

        // SQL para crear la vista
        const createViewSQL = `
        CREATE OR REPLACE VIEW v_medical_history_full AS
        SELECT mr.id,
            mr.pet_id,
            mr.visit_date,
            mr.diagnosis,
            mr.treatment,
            mr.medications,
            mr.weight,
            mr.temperature,
            mr.notes,
            mr.veterinarian_name,
            mr.prescription_id,
            mr.created_at,
            p.name AS pet_name,
            p.species,
            p.breed,
            u.id AS owner_id,
            u.full_name AS owner_name,
            u.email AS owner_email,
            pr.pdf_url AS prescription_pdf,
            pr.instructions AS prescription_instructions,
            v.full_name AS vet_name
        FROM medical_records mr
            JOIN pets p ON mr.pet_id = p.id
            JOIN users u ON p.owner_id = u.id
            LEFT JOIN prescriptions pr ON mr.prescription_id = pr.id
            LEFT JOIN users v ON mr.vet_id = v.id;
        `;

        await pool.query(createViewSQL);
        console.log('✅ Vista v_medical_history_full creada exitosamente');

    } catch (error) {
        console.error('❌ Error creando la vista:', error);
    } finally {
        await pool.end();
    }
}

main();
