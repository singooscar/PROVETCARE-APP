import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'provetcare_db',
    password: '2411567', // Hardcoded for this utility script
    port: 5432,
});

// Estilos CSS para el reporte
const styles = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f0f2f5; }
    h1 { color: #2c3e50; }
    h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-bottom: 20px; }
    th { background: #3498db; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 14px; }
    tr:hover { background-color: #f1f1f1; }
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .true { background: #d4edda; color: #155724; }
    .false { background: #f8d7da; color: #721c24; }
    .timestamp { color: #666; font-size: 12px; margin-bottom: 20px; }
`;

async function exportToHtml() {
    try {
        console.log('📊 Generando reporte HTML...');
        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ProVetCare - Base de Datos</title><style>${styles}</style></head><body>`;
        html += `<h1>📁 ProVetCare - Vista de Datos</h1>`;
        html += `<div class="timestamp">Generado: ${new Date().toLocaleString()}</div>`;

        // 1. Usuarios
        const users = await pool.query('SELECT id, full_name, email, role, phone, created_at FROM users ORDER BY id DESC');
        html += `<h2>👤 Usuarios (${users.rows.length})</h2>`;
        html += createTable(users.rows, ['id', 'full_name', 'email', 'role', 'phone']);

        // 2. Mascotas
        const pets = await pool.query('SELECT p.id, p.name, p.species, u.email as owner, p.created_at FROM pets p JOIN users u ON p.owner_id = u.id');
        html += `<h2>🐾 Mascotas (${pets.rows.length})</h2>`;
        html += createTable(pets.rows, ['id', 'name', 'species', 'owner']);

        // 3. Códigos de Invitación
        const codes = await pool.query('SELECT id, code, is_used, expires_at FROM invitation_codes');
        html += `<h2>🔑 Códigos de Invitación (${codes.rows.length})</h2>`;
        html += createTable(codes.rows, ['id', 'code', 'is_used', 'expires_at']);

        // 4. Citas
        const appts = await pool.query(`
            SELECT a.id, p.name as pet, u.full_name as client, a.status, a.appointment_date, a.service_type 
            FROM appointments a 
            JOIN pets p ON a.pet_id = p.id 
            JOIN users u ON a.client_id = u.id 
            ORDER BY a.appointment_date DESC
        `);
        html += `<h2>📅 Citas (${appts.rows.length})</h2>`;
        html += createTable(appts.rows, ['id', 'pet', 'client', 'status', 'service_type', 'appointment_date']);

        html += `</body></html>`;

        fs.writeFileSync('DATOS_TIEMPO_REAL.html', html);
        console.log('✅ Archivo "DATOS_TIEMPO_REAL.html" creado exitosamente.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

function createTable(rows, columns) {
    if (rows.length === 0) return '<p>No hay datos registrados.</p>';

    let t = '<table><thead><tr>';
    columns.forEach(col => t += `<th>${col.toUpperCase()}</th>`);
    t += '</tr></thead><tbody>';

    rows.forEach(row => {
        t += '<tr>';
        columns.forEach(col => {
            let val = row[col];
            if (val === true || val === false) {
                val = `<span class="badge ${val}">${val}</span>`;
            }
            t += `<td>${val === null ? '-' : val}</td>`;
        });
        t += '</tr>';
    });
    t += '</tbody></table>';
    return t;
}

exportToHtml();
