import express from 'express';
import {
    getDashboardStats,
    getClientsWithPets,
    sendCustomEmail
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/clients-pets', getClientsWithPets);
router.post('/send-custom-email', sendCustomEmail);

export default router;
