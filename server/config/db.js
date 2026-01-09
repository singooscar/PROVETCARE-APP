import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'provetcare_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    };

export const pool = new Pool({
    ...poolConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Verificar conexión
pool.on('connect', () => {
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
});

pool.on('error', (err) => {
    console.error('❌ Error inesperado en el cliente de PostgreSQL', err);
    process.exit(-1);
});

// Helper para queries
export const query = (text, params) => pool.query(text, params);
