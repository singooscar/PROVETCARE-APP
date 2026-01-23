import express from 'express';
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    downloadInvoicePDF
} from '../controllers/invoiceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/download', downloadInvoicePDF);

export default router;
