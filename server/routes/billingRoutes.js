import express from 'express';
import {
    getPendingCharges,
    getBillingHistory,
    processPayment,
    createCharge
} from '../controllers/billingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.get('/pending/:clientId', getPendingCharges);
router.get('/history/:clientId', getBillingHistory);
router.post('/pay', processPayment);
router.post('/charge', createCharge);

export default router;
