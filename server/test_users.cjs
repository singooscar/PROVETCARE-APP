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
        console.log('Testing Users Table...');
        const res = await pool.query('SELECT count(*) FROM users');
        console.log('Users count:', res.rows[0].count);

        console.log('Testing Admin User...');
        const admin = await pool.query("SELECT * FROM users WHERE email = 'admin@provetcare.com'");
        console.log('Admin found:', admin.rows.length > 0);

    } catch (error) {
        console.error('Database Error:', error);
    } finally {
        await pool.end();
    }
}

main();
