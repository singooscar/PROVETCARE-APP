import express from 'express';
import { getInventory, getServices } from '../controllers/inventoryController.js';
import { getInvoice, createPaymentIntent } from '../controllers/billingController.js';
import { createPrescription } from '../controllers/prescriptionController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Inventario y Servicios (Público para autenticados)
router.get('/inventory', authenticateToken, getInventory);
router.get('/services', authenticateToken, getServices);

// Facturación
router.get('/invoices/:appointmentId', authenticateToken, getInvoice);
router.post('/payments/create-intent', authenticateToken, createPaymentIntent);

// Recetas (Solo Veterinarios/Admins)
router.post('/prescriptions', authenticateToken, requireAdmin, createPrescription);

export default router;
