import express from 'express';
import {
    getMedicalHistory,
    createMedicalRecord,
    updateMedicalRecord,
    createPrescription,
    getPetPrescriptions,
    linkPrescriptionToMedicalRecord,
    getConsultationByAppointment
} from '../controllers/medicalRecordController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas (o protegidas por auth normal)
router.get('/pet/:petId', authenticateToken, getMedicalHistory);
router.get('/prescriptions/pet/:petId', authenticateToken, getPetPrescriptions);

// Rutas de administración (Veterinarios)
router.get('/consultation/:appointmentId', authenticateToken, requireAdmin, getConsultationByAppointment);
router.post('/', authenticateToken, requireAdmin, createMedicalRecord);
router.put('/:id', authenticateToken, requireAdmin, updateMedicalRecord);
router.post('/prescriptions', authenticateToken, requireAdmin, createPrescription);
router.post('/prescriptions/link', authenticateToken, requireAdmin, linkPrescriptionToMedicalRecord);

export default router;
