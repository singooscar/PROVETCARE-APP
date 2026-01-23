const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'provetcare_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function fixInventoryStock() {
    try {
        console.log('🔧 Arreglando stock de inventario...\n');

        // Actualizar stock de todos los medicamentos a valores positivos
        const result = await pool.query(`
            UPDATE inventory 
            SET stock = CASE 
                WHEN name LIKE '%Amoxicilina%' THEN 150
                WHEN name LIKE '%Cefalexina%' THEN 120
                WHEN name LIKE '%Enrofloxacina%' THEN 80
                WHEN name LIKE '%Ivermectina%' THEN 60
                WHEN name LIKE '%Praziquantel%' THEN 100
                WHEN name LIKE '%Fenbendazol%' THEN 90
                WHEN name LIKE '%Polivalente%' THEN 40
                WHEN name LIKE '%Antirrábica%' THEN 50
                WHEN name LIKE '%Triple Felina%' THEN 35
                WHEN name LIKE '%Meloxicam%' THEN 200
                WHEN name LIKE '%Carprofeno%' THEN 150
                WHEN name LIKE '%Dexametasona%' THEN 180
                WHEN name LIKE '%Complejo%' THEN 100
                WHEN name LIKE '%Calcio%' THEN 80
                WHEN name LIKE '%Omega%' THEN 60
                WHEN name LIKE '%Tramadol%' THEN 70
                WHEN name LIKE '%Paracetamol%' THEN 150
                WHEN name LIKE '%Solución%' THEN 200
                WHEN name LIKE '%Alcohol%' THEN 250
                WHEN name LIKE '%Gasas%' THEN 300
                ELSE 50
            END,
            updated_at = CURRENT_TIMESTAMP
            WHERE stock IS NULL OR stock <= 0
        `);

        console.log(`✅ ${result.rowCount} medicamentos actualizados`);

        // Verificar resultado
        const checkRes = await pool.query(`
            SELECT COUNT(*) as total, 
                   COUNT(*) FILTER (WHERE stock > 0) as con_stock,
                   COUNT(*) FILTER (WHERE stock IS NULL OR stock <= 0) as sin_stock
            FROM inventory
        `);

        const stats = checkRes.rows[0];
        console.log(`\n📊 Estado del inventario:`);
        console.log(`   Total medicamentos: ${stats.total}`);
        console.log(`   Con stock: ${stats.con_stock}`);
        console.log(`   Sin stock: ${stats.sin_stock}`);

        // Mostrar algunos ejemplos
        const samplesRes = await pool.query(`
            SELECT name, stock, unit_price 
            FROM inventory 
            WHERE stock > 0 
            ORDER BY name 
            LIMIT 10
        `);

        console.log(`\n💊 Medicamentos disponibles (primeros 10):`);
        samplesRes.rows.forEach(med => {
            console.log(`   • ${med.name} - Stock: ${med.stock} - $${med.unit_price}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixInventoryStock();
