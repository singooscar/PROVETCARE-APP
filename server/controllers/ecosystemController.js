import { pool } from '../config/db.js';

export const getInventory = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Error al cargar inventario' });
    }
};

export const getServices = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM services WHERE active = true ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Error al cargar servicios' });
    }
};
