import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'provetcare_db',
    password: '2411567',
    port: 5432,
});

async function getUsers() {
    try {
        const res = await pool.query("SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 5");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
getUsers();
