import { pool } from '../config/db.js';

// Obtener todas las mascotas del usuario autenticado
export const getUserPets = async (req, res) => {
    try {
        console.log(`[PETS] Fetching pets for user ${req.user.id}`);
        const result = await pool.query(
            `SELECT id, name, species, breed, age, weight, gender, photo_url, notes, created_at 
       FROM pets 
       WHERE owner_id = $1 
       ORDER BY created_at DESC`,
            [req.user.id]
        );
        console.log(`[PETS] Found ${result.rows.length} pets`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mascotas:', error);
        res.status(500).json({ error: 'Error al obtener mascotas' });
    }
};

// Obtener una mascota específica
export const getPetById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM pets WHERE id = $1 AND owner_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener mascota:', error);
        res.status(500).json({ error: 'Error al obtener mascota' });
    }
};

// Crear una nueva mascota
export const createPet = async (req, res) => {
    try {
        const { name, species, breed, age, weight, gender, photo_url, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO pets (owner_id, name, species, breed, age, weight, gender, photo_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [req.user.id, name, species, breed, age, weight, gender, photo_url, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear mascota:', error);
        res.status(500).json({ error: 'Error al crear mascota' });
    }
};

// Actualizar una mascota
export const updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, species, breed, age, weight, gender, photo_url, notes } = req.body;

        // Verificar que la mascota pertenece al usuario
        const checkOwner = await pool.query(
            'SELECT id FROM pets WHERE id = $1 AND owner_id = $2',
            [id, req.user.id]
        );

        if (checkOwner.rows.length === 0) {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }

        const result = await pool.query(
            `UPDATE pets 
       SET name = $1, species = $2, breed = $3, age = $4, weight = $5, 
           gender = $6, photo_url = $7, notes = $8
       WHERE id = $9 AND owner_id = $10
       RETURNING *`,
            [name, species, breed, age, weight, gender, photo_url, notes, id, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar mascota:', error);
        res.status(500).json({ error: 'Error al actualizar mascota' });
    }
};

// Eliminar una mascota
export const deletePet = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM pets WHERE id = $1 AND owner_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }

        res.json({ message: 'Mascota eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar mascota:', error);
        res.status(500).json({ error: 'Error al eliminar mascota' });
    }
};

// Obtener historial médico de una mascota
export const getPetMedicalHistory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la mascota pertenece al usuario
        const checkOwner = await pool.query(
            'SELECT id FROM pets WHERE id = $1 AND owner_id = $2',
            [id, req.user.id]
        );

        if (checkOwner.rows.length === 0) {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }

        const result = await pool.query(
            `SELECT * FROM medical_records 
       WHERE pet_id = $1 
       ORDER BY visit_date DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener historial médico:', error);
        res.status(500).json({ error: 'Error al obtener historial médico' });
    }
};
