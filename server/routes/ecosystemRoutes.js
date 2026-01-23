import express from 'express';
import { getInventory, getServices } from '../controllers/ecosystemController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/inventory', getInventory);
router.get('/services', getServices);

export default router;
