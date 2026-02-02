/**
 * Script para actualizar el esquema de la base de datos con las nuevas columnas de signos vitales
 * Ejecutar: node server/scripts/update-vitals.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // Load .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del servidor
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateSchema() {
    try {
        console.log('🩺 Actualizando esquema de signos vitales...');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '../database/update_vitals_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando script SQL...');
        await pool.query(sql);

        console.log('✅ Tablas actualizadas correctamente.');

        // Verificar columnas
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'medical_records'
        `);

        console.log('📋 Columnas actuales en medical_records:', res.rows.map(r => r.column_name).join(', '));

    } catch (error) {
        console.error('❌ Error actualizando esquema:', error);
    } finally {
        await pool.end();
    }
}

updateSchema();
