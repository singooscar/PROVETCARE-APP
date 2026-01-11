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
import { validateAdminRegistration, validateLogin } from '../middleware/validators.js';

const router = express.Router();

// Rutas públicas
// TEMPORARY: Zod validation disabled due to internal bug - validation moved to controller
router.post('/register', register);
router.post('/register-admin', validateAdminRegistration, registerAdmin);
router.post('/login', validateLogin, login);

// Rutas protegidas
router.get('/verify', authenticateToken, verifyToken);
router.get('/profile', authenticateToken, getProfile);

// Rutas solo para administradores
router.post('/invitation-codes', authenticateToken, requireAdmin, generateInvitationCode);

export default router;
