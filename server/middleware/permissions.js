import { pool } from '../config/db.js';

/**
 * MIDDLEWARE DE PERMISOS
 * Sistema de autorización basado en roles y ownership
 */

/**
 * Verificar que el usuario es Admin/Veterinario
 */
export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo administradores.'
        });
    }
    next();
};

/**
 * Verificar que el usuario es Admin o dueño de la mascota
 */
export const requireAdminOrPetOwner = async (req, res, next) => {
    try {
        const petId = req.params.petId || req.body.petId;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin tiene acceso total
        if (userRole === 'admin') {
            return next();
        }

        // Verificar ownership
        const result = await pool.query(
            'SELECT owner_id FROM pets WHERE id = $1',
            [petId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            });
        }

        if (result.rows[0].owner_id === userId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para acceder a esta información'
        });

    } catch (error) {
        console.error('Error en middleware de permisos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando permisos'
        });
    }
};

/**
 * Verificar que el usuario puede editar un registro médico
 * Solo Admin o el veterinario que lo creó
 */
export const requireMedicalRecordEditPermission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin puede editar todo
        if (userRole === 'admin') {
            return next();
        }

        // Verificar que el usuario es el veterinario que creó el registro
        const result = await pool.query(
            'SELECT vet_id FROM medical_records WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro médico no encontrado'
            });
        }

        if (result.rows[0].vet_id === userId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Solo puedes editar registros que tú creaste'
        });

    } catch (error) {
        console.error('Error verificando permisos de edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando permisos'
        });
    }
};

/**
 * Verificar que el usuario puede ver un registro médico
 * Admin, dueño de la mascota, o veterinario que lo creó
 */
export const requireMedicalRecordViewPermission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin puede ver todo
        if (userRole === 'admin') {
            return next();
        }

        // Obtener información del registro y mascota
        const result = await pool.query(`
            SELECT mr.vet_id, p.owner_id
            FROM medical_records mr
            JOIN pets p ON mr.pet_id = p.id
            WHERE mr.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro médico no encontrado'
            });
        }

        const record = result.rows[0];

        // Puede ver si es el dueño o el veterinario
        if (record.owner_id === userId || record.vet_id === userId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para ver este registro'
        });

    } catch (error) {
        console.error('Error verificando permisos de visualización:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando permisos'
        });
    }
};
