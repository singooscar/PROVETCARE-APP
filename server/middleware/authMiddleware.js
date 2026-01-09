import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

// Middleware para autenticar token JWT
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'provetcare_secret_key');

        // Obtener información del usuario
        const result = await pool.query(
            'SELECT id, full_name, email, phone, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        req.user = {
            id: user.id,
            name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar rol de admin
export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado - Se requiere rol de administrador' });
    }
    next();
};

// Middleware para verificar rol de cliente
export const requireClient = (req, res, next) => {
    if (req.user.role !== 'client') {
        return res.status(403).json({ error: 'Acceso denegado - Solo clientes' });
    }
    next();
};
