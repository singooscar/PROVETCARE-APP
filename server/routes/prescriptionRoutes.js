import express from 'express';
import {
    createPrescription,
    getPetPrescriptions,
    downloadPrescriptionPDF
} from '../controllers/prescriptionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, createPrescription);
router.get('/pet/:petId', authenticateToken, getPetPrescriptions);
router.get('/:id/download', authenticateToken, downloadPrescriptionPDF);

export default router;
