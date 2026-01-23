const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'provetcare_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function createInventoryTable() {
    try {
        console.log('💊 Creando tabla de inventario...\n');

        // 1. Crear tabla inventory
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                description TEXT,
                unit_price DECIMAL(10, 2) NOT NULL,
                stock INTEGER DEFAULT 0,
                min_stock INTEGER DEFAULT 10,
                unit VARCHAR(50) DEFAULT 'unidad',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla inventory creada');

        // 2. Crear índices
        await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category)');
        console.log('✅ Índices creados');

        // 3. Poblar con medicamentos veterinarios
        const medicamentos = [
            // Antibióticos
            { name: 'Amoxicilina 500mg', category: 'Antibiótico', description: 'Antibiótico de amplio espectro', price: 25.50, stock: 150, unit: 'tableta' },
            { name: 'Cefalexina 250mg', category: 'Antibiótico', description: 'Antibiótico para infecciones bacterianas', price: 18.75, stock: 120, unit: 'cápsula' },
            { name: 'Enrofloxacina 50mg', category: 'Antibiótico', description: 'Fluoroquinolona para perros y gatos', price: 32.00, stock: 80, unit: 'tableta' },

            // Antiparasitarios
            { name: 'Ivermectina 1%', category: 'Antiparasitario', description: 'Antiparasitario interno y externo', price: 45.00, stock: 60, unit: 'ml' },
            { name: 'Praziquantel 50mg', category: 'Antiparasitario', description: 'Desparasitante contra tenias', price: 22.50, stock: 100, unit: 'tableta' },
            { name: 'Fenbendazol 500mg', category: 'Antiparasitario', description: 'Antiparasitario de amplio espectro', price: 28.00, stock: 90, unit: 'tableta' },

            // Vacunas
            { name: 'Vacuna Polivalente', category: 'Vacuna', description: 'Protección contra múltiples enfermedades', price: 85.00, stock: 40, unit: 'dosis' },
            { name: 'Vacuna Antirrábica', category: 'Vacuna', description: 'Prevención de rabia', price: 65.00, stock: 50, unit: 'dosis' },
            { name: 'Vacuna Triple Felina', category: 'Vacuna', description: 'Para gatos (Rinotraqueitis, Calicivirus, Panleucopenia)', price: 75.00, stock: 35, unit: 'dosis' },

            // Antiinflamatorios
            { name: 'Meloxicam 1mg', category: 'Antiinflamatorio', description: 'AINE para dolor y fiebre', price: 15.50, stock: 200, unit: 'tableta' },
            { name: 'Carprofeno 75mg', category: 'Antiinflamatorio', description: 'Antiinflamatorio para perros', price: 20.00, stock: 150, unit: 'tableta' },
            { name: 'Dexametasona 0.5mg', category: 'Antiinflamatorio', description: 'Corticoide potente', price: 12.00, stock: 180, unit: 'tableta' },

            // Vitaminas y suplementos
            { name: 'Complejo Vitamínico B', category: 'Vitamina', description: 'Vitaminas del grupo B', price: 18.00, stock: 100, unit: 'ampolla' },
            { name: 'Calcio + Vitamina D3', category: 'Suplemento', description: 'Para fortalecimiento óseo', price: 22.00, stock: 80, unit: 'tableta' },
            { name: 'Omega 3 para mascotas', category: 'Suplemento', description: 'Ácidos grasos esenciales', price: 35.00, stock: 60, unit: 'cápsula' },

            // Analgésicos
            { name: 'Tramadol 50mg', category: 'Analgésico', description: 'Analgésico opioide', price: 28.00, stock: 70, unit: 'tableta' },
            { name: 'Paracetamol veterinario', category: 'Analgésico', description: 'Antipirético y analgésico', price: 10.00, stock: 150, unit: 'tableta' },

            // Otros
            { name: 'Solución fisiológica 500ml', category: 'Solución', description: 'Para hidratación', price: 8.50, stock: 200, unit: 'bolsa' },
            { name: 'Alcohol antiséptico', category: 'Antiséptico', description: 'Limpieza de heridas', price: 5.00, stock: 250, unit: 'frasco' },
            { name: 'Gasas estériles', category: 'Material médico', description: 'Paquete de 10 gasas', price: 3.50, stock: 300, unit: 'paquete' }
        ];

        console.log('\n📦 Insertando medicamentos...');
        for (const med of medicamentos) {
            await pool.query(`
                INSERT INTO inventory (name, category, description, unit_price, stock, unit)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT DO NOTHING
            `, [med.name, med.category, med.description, med.price, med.stock, med.unit]);
            console.log(`   ✓ ${med.name}`);
        }

        // 4. Verificar
        const countRes = await pool.query('SELECT COUNT(*) FROM inventory');
        const categoriesRes = await pool.query('SELECT DISTINCT category FROM inventory ORDER BY category');

        console.log(`\n🎉 Inventario creado exitosamente!`);
        console.log(`📊 Total de productos: ${countRes.rows[0].count}`);
        console.log(`📂 Categorías disponibles:`);
        categoriesRes.rows.forEach(cat => console.log(`   • ${cat.category}`));

        // 5. Mostrar algunos productos
        console.log(`\n💊 Algunos productos disponibles:`);
        const samplesRes = await pool.query('SELECT name, category, stock, unit_price FROM inventory LIMIT 5');
        samplesRes.rows.forEach(prod => {
            console.log(`   • ${prod.name} - Stock: ${prod.stock} - Precio: $${prod.unit_price}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createInventoryTable();
