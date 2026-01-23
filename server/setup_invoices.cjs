const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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

        const sqlPath = path.join(__dirname, 'database', 'create_invoices_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Ejecutando script de facturación...');
        await pool.query(sql);

        console.log('✅ Tablas de facturas creadas exitosamente');

    } catch (error) {
        console.error('❌ Error configurando facturación:', error);
    } finally {
        await pool.end();
    }
}

main();
