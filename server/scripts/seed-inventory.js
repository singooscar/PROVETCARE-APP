/**
 * Script simplificado para poblar inventario
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function seedInventory() {
    // Crear pool con configuración directa
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'provetcare_db',
        user: 'postgres',
        password: '2411567', // Directamente como string
    });

    try {
        console.log('🌱 Iniciando seed de inventario...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '../database/seed_inventory.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando script SQL...');

        // Ejecutar el SQL
        await pool.query(sql);

        // Verificar resultados
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_medicamentos,
                COUNT(*) FILTER (WHERE active = true) as medicamentos_activos,
                SUM(stock) as stock_total
            FROM inventory_items
        `);

        console.log('\n✅ Inventario poblado exitosamente!\n');
        console.log('📊 Resumen:');
        console.log(`   Total de medicamentos: ${result.rows[0].total_medicamentos}`);
        console.log(`   Medicamentos activos: ${result.rows[0].medicamentos_activos}`);
        console.log(`   Stock total: ${result.rows[0].stock_total}`);
        console.log('\n🎉 ¡Ahora puedes buscar medicamentos en la aplicación!\n');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error poblando inventario:', error);
        console.error('\nDetalles:', error.message);
        await pool.end();
        process.exit(1);
    }
}

seedInventory();
