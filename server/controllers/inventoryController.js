import { pool } from '../config/db.js';

// Obtener inventario (medicamentos y productos)
export const getInventory = async (req, res) => {
    try {
        const { search } = req.query;

        let query = 'SELECT id, name, description, unit_price, stock, unit_type FROM inventory_items WHERE active = TRUE';
        const params = [];

        if (search) {
            query += ' AND name ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ error: 'Error al cargar inventario' });
    }
};

// Obtener catálogo de servicios clínicos
export const getServices = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, description, base_price, duration_minutes FROM services_catalog WHERE active = TRUE ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({ error: 'Error al cargar servicios' });
    }
};
