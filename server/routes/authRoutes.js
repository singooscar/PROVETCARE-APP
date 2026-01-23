import express from 'express';
import {
    register,
    login,
    verifyToken,
    getProfile,
    registerAdmin,
    generateInvitationCode
} from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.get('/verify', authenticateToken, verifyToken);

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile);

// Rutas de administración
router.post('/admin/register', registerAdmin);
router.post('/invitation-codes', authenticateToken, requireAdmin, generateInvitationCode);

export default router;
