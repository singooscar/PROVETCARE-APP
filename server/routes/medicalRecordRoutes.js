import express from 'express';
import {
    getMedicalHistory,
    createMedicalRecord,
    updateMedicalRecord,
    createPrescription,
    getPetPrescriptions,
    linkPrescriptionToMedicalRecord
} from '../controllers/medicalRecordController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas (o protegidas por auth normal)
router.get('/history/:petId', authenticateToken, getMedicalHistory);
router.get('/prescriptions/pet/:petId', authenticateToken, getPetPrescriptions);

// Rutas de administración (Veterinarios)
router.post('/', authenticateToken, requireAdmin, createMedicalRecord);
router.put('/:id', authenticateToken, requireAdmin, updateMedicalRecord);
router.post('/prescriptions', authenticateToken, requireAdmin, createPrescription);
router.post('/prescriptions/link', authenticateToken, requireAdmin, linkPrescriptionToMedicalRecord);

export default router;
