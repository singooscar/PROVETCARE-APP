// Script de prueba para el sistema de recetas médicas
// Ejecutar con: node test_prescription.cjs

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function testPrescriptionSystem() {
    console.log('🧪 Iniciando pruebas del sistema de recetas...\n');

    try {
        // 1. Verificar tablas creadas
        console.log('1️⃣ Verificando tablas...');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('prescriptions', 'prescription_items')
        `);

        if (tables.rows.length === 2) {
            console.log('   ✅ Tablas creadas: prescriptions, prescription_items\n');
        } else {
            console.log('   ❌ Faltan tablas. Ejecuta update_medical_schema.sql\n');
            return;
        }

        // 2. Verificar columnas en medical_records
        console.log('2️⃣ Verificando medical_records...');
        const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'medical_records' 
            AND column_name IN ('prescription_id', 'vet_id')
        `);

        if (columns.rows.length === 2) {
            console.log('   ✅ Columnas agregadas: prescription_id, vet_id\n');
        } else {
            console.log('   ⚠️  Actualiza medical_records con el script SQL\n');
        }

        // 3. Verificar vista
        console.log('3️⃣ Verificando vista...');
        const view = await pool.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_name = 'v_medical_history_full'
        `);

        if (view.rows.length > 0) {
            console.log('   ✅ Vista creada: v_medical_history_full\n');
        } else {
            console.log('   ⚠️  Vista no encontrada\n');
        }

        // 4. Contar registros existentes
        console.log('4️⃣ Estadísticas actuales:');
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM prescriptions) as prescriptions,
                (SELECT COUNT(*) FROM prescription_items) as items,
                (SELECT COUNT(*) FROM medical_records) as records
        `);

        const { prescriptions, items, records } = stats.rows[0];
        console.log(`   📊 Recetas: ${prescriptions}`);
        console.log(`   💊 Items de receta: ${items}`);
        console.log(`   📋 Registros médicos: ${records}\n`);

        // 5. Verificar directorio de PDFs
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../uploads/prescriptions');

        console.log('5️⃣ Verificando directorio de PDFs...');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`   ✅ Directorio creado: ${uploadsDir}\n`);
        } else {
            const files = fs.readdirSync(uploadsDir);
            console.log(`   ✅ Directorio existe: ${files.length} archivos\n`);
        }

        // 6. Test de ejemplo (opcional - solo si hay datos)
        if (prescriptions > 0) {
            console.log('6️⃣ Mostrando última receta creada:');
            const lastPrescription = await pool.query(`
                SELECT 
                    pr.id,
                    pr.instructions,
                    pr.pdf_url,
                    pr.created_at,
                    v.full_name as vet_name,
                    p.name as pet_name
                FROM prescriptions pr
                JOIN users v ON pr.vet_id = v.id
                JOIN pets p ON pr.pet_id = p.id
                ORDER BY pr.created_at DESC
                LIMIT 1
            `);

            const rec = lastPrescription.rows[0];
            console.log(`   📄 Receta #${rec.id}`);
            console.log(`   🐾 Mascota: ${rec.pet_name}`);
            console.log(`   👨‍⚕️ Veterinario: ${rec.vet_name}`);
            console.log(`   📎 PDF: ${rec.pdf_url || 'No generado'}`);
            console.log(`   📅 Fecha: ${rec.created_at}\n`);
        }

        console.log('═══════════════════════════════════════');
        console.log('✅ Sistema de recetas configurado correctamente');
        console.log('═══════════════════════════════════════\n');

        console.log('🎯 Próximos pasos:');
        console.log('1. Inicia sesión como admin en el frontend');
        console.log('2. Navega a una mascota');
        console.log('3. Crea una nueva receta');
        console.log('4. Verifica que se genere el PDF');
        console.log('5. Revisa tu email para el PDF adjunto\n');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    } finally {
        await pool.end();
    }
}

testPrescriptionSystem();
