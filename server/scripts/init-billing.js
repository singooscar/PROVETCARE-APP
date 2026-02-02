/**
 * Script para inicializar el esquema de pagos
 * Ejecutar: node server/scripts/init-billing.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function initBilling() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'provetcare_db',
        user: 'postgres',
        password: '2411567',
    });

    try {
        console.log('💳 Iniciando esquema de facturación y pagos...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '../database/create_billing_simple.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando script SQL...');

        // Ejecutar el SQL
        await pool.query(sql);

        // Verificar resultados
        const chargesCount = await pool.query('SELECT COUNT(*) FROM charges');
        const paymentsCount = await pool.query('SELECT COUNT(*) FROM payments');

        console.log('\n✅ Esquema de facturación inicializado correctamente!\n');
        console.log('📊 Resumen:');
        console.log(`   Total de cargos: ${chargesCount.rows[0].count}`);
        console.log(`   Total de pagos: ${paymentsCount.rows[0].count}`);
        console.log('\n🎉 ¡Sistema de pagos listo para usar!\n');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error inicializando facturación:', error);
        console.error('\nDetalles:', error.message);
        await pool.end();
        process.exit(1);
    }
}

initBilling();
