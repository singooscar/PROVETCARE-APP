import express from 'express';
import {
    getPendingCharges,
    getBillingHistory,
    processPayment,
    createCharge,
    getAllCharges,
    getAllPayments
} from '../controllers/billingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

// Client routes
router.get('/pending/:clientId', getPendingCharges);
router.get('/history/:clientId', getBillingHistory);
router.post('/pay', processPayment);
router.post('/charge', createCharge);

// Admin routes
router.get('/admin/all-charges', getAllCharges);
router.get('/admin/all-payments', getAllPayments);

export default router;
