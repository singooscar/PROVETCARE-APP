// Check pets
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function checkPets() {
    const r = await pool.query('SELECT p.id, p.name, p.species, u.full_name as owner FROM pets p JOIN users u ON p.owner_id = u.id LIMIT 10');
    console.log('🐾 Mascotas disponibles:\n');
    r.rows.forEach(p => console.log(`   ID: ${p.id} - ${p.name} (${p.species}) - Dueño: ${p.owner}`));
    await pool.end();
}

checkPets();
