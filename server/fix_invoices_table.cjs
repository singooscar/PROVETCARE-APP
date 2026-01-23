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

        // 1. Verificar si la columna existe
        const check = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='invoices' AND column_name='notes'
        `);

        if (check.rows.length === 0) {
            console.log('⚠️ Columna "notes" faltante. Agregándola...');
            await pool.query(`ALTER TABLE invoices ADD COLUMN notes TEXT`);
            console.log('✅ Columna "notes" agregada correctamente');
        } else {
            console.log('✅ La columna "notes" ya existe');
        }

        // También aseguremos pdf_url por si acaso
        const checkPdf = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='invoices' AND column_name='pdf_url'
        `);

        if (checkPdf.rows.length === 0) {
            console.log('⚠️ Columna "pdf_url" faltante. Agregándola...');
            await pool.query(`ALTER TABLE invoices ADD COLUMN pdf_url TEXT`);
            console.log('✅ Columna "pdf_url" agregada correctamente');
        }

    } catch (error) {
        console.error('❌ Error arreglando esquema:', error);
    } finally {
        await pool.end();
    }
}

main();
