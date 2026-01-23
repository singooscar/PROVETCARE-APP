import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getInventory, getInventoryItem, updateStock } from '../controllers/inventoryController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/inventory?search=término
router.get('/', getInventory);

// GET /api/inventory/:id
router.get('/:id', getInventoryItem);

// PUT /api/inventory/:id/stock
router.put('/:id/stock', updateStock);

export default router;
