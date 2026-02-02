import { pool } from '../config/db.js';

/**
 * Obtener inventario con búsqueda opcional
 * GET /api/inventory?search=término
 */
export const getInventory = async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT id, name, description, unit_price, stock, unit_type, active
            FROM inventory_items
            WHERE active = true
        `;

        console.log(`🔍 Búsqueda de inventario: "${search || ''}"`);

        const params = [];

        // Si hay búsqueda, filtrar por nombre o descripción
        if (search && search.trim()) {
            query += ` AND (
                name ILIKE $1 OR
                description ILIKE $1
            )`;
            params.push(`%${search.trim()}%`);
        }

        query += ` ORDER BY name LIMIT 50`;

        const result = await pool.query(query, params);

        console.log(`✅ Encontrados ${result.rows.length} productos`);

        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo inventario:', error);
        res.status(500).json({
            error: 'Error al obtener inventario',
            message: error.message
        });
    }
};

/**
 * Obtener un producto por ID
 * GET /api/inventory/:id
 */
export const getInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM inventory_items WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
};

/**
 * Actualizar stock de un producto
 * PUT /api/inventory/:id/stock
 */
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (typeof quantity !== 'number') {
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        const result = await pool.query(
            `UPDATE inventory_items 
             SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [quantity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error actualizando stock:', error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
};
