import express from 'express';
import {
    requestAppointment,
    createFollowUpAppointment,
    updateAppointmentStatus,
    markAsUnderReview,
    getPendingAppointments,
    getAllAppointments,
    getAppointmentById  // NUEVO: Obtener cita individual con toda la info
} from '../controllers/appointmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================================
// RUTAS DE CITAS - PROVETCARE
// ============================================================================

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros

// Obtener todas las citas (con filtros opcionales)
router.get('/', authenticateToken, getAllAppointments);

// Obtener citas pendientes (admin) - DEBE IR ANTES DE /:id
router.get('/pending', authenticateToken, requireAdmin, getPendingAppointments);

// Obtener cita individual con historial médico y prescripciones
router.get('/:id', authenticateToken, getAppointmentById);

// Solicitar cita (cliente)
router.post('/request', authenticateToken, requestAppointment);

// Crear cita de seguimiento (admin/veterinario)
router.post('/follow-up', authenticateToken, requireAdmin, createFollowUpAppointment);

// Actualizar estado de cita (admin)
router.patch('/:id/status', authenticateToken, requireAdmin, updateAppointmentStatus);

// Marcar cita como en revisión (admin)
router.patch('/:id/mark-review', authenticateToken, requireAdmin, markAsUnderReview);

export default router;
