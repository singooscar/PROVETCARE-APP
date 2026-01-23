import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'provetcare_db',
    password: '2411567', // Hardcoded for utility script
    port: 5432,
});

async function runMigration() {
    try {
        console.log('🔄 INICIANDO MIGRACIÓN DEL ECOSISTEMA...');

        // 1. Leer archivos SQL
        const migrationSql = fs.readFileSync('../MIGRACION_ECOSISTEMA.sql', 'utf8');
        const seedSql = fs.readFileSync('../SEED_ECOSISTEMA.sql', 'utf8');

        // 2. Ejecutar Migración de Tablas
        console.log('🚧 Creando tablas...');
        await pool.query(migrationSql);
        console.log('✅ Tablas creadas correctamente.');

        // 3. Ejecutar Seed Data
        console.log('🌱 Insertando datos semilla...');
        await pool.query(seedSql);
        console.log('✅ Datos insertados correctamente.');

        // 4. Verificación rápida
        const services = await pool.query('SELECT count(*) FROM services_catalog');
        const items = await pool.query('SELECT count(*) FROM inventory_items');

        console.log('📊 RESUMEN:');
        console.log(`   - Servicios: ${services.rows[0].count}`);
        console.log(`   - Productos: ${items.rows[0].count}`);

    } catch (e) {
        console.error('❌ ERROR EN MIGRACIÓN:', e);
    } finally {
        pool.end();
    }
}

runMigration();
