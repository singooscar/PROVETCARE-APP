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
        console.log('--- Checking Tables ---');
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('charges', 'payments', 'payment_charges');
        `);
        console.log(res.rows);

        if (res.rows.find(r => r.table_name === 'charges')) {
            console.log('--- Checking Charges Columns ---');
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'charges';
             `);
            console.log(cols.rows);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();
