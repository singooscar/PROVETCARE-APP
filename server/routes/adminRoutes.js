import express from 'express';
import { getClientsWithPets, getDashboardStats } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware de seguridad: Todas las rutas requieren ser ADMIN
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/clients-pets', getClientsWithPets);
router.get('/stats', getDashboardStats);

export default router;
