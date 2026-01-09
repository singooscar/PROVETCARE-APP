import express from 'express';
import {
    updateAppointmentStatus,
    getPendingAppointments,
    getAllAppointments,
    requestAppointment,
    createFollowUpAppointment,
    markAsUnderReview
} from '../controllers/appointmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * RUTAS DE CITAS - DUAL FLOW SYSTEM
 * 
 * FLUJO A - Cliente Solicita:
 *   POST /request → REQUESTED → UNDER_REVIEW → CONFIRMED
 * 
 * FLUJO B - Veterinario Crea Control:
 *   POST /follow-up → CONFIRMED (directo)
 */

// ============================================================================
// RUTAS PARA CLIENTES
// ============================================================================

/**
 * POST /api/appointments/request
 * Cliente solicita cita (FLUJO A - Email 1/3)
 * 
 * Body: {
 *   petId, appointmentDate, appointmentTime, serviceType, notes
 * }
 */
router.post('/request', authenticateToken, requestAppointment);

// ============================================================================
// RUTAS SOLO PARA ADMINISTRADORES (VETERINARIOS)
// ============================================================================

/**
 * POST /api/appointments/follow-up
 * Veterinario crea cita de control (FLUJO B - Email único)
 * 
 * Body: {
 *   petId, clientId, appointmentDate, appointmentTime, serviceType, notes
 * }
 */
router.post('/follow-up', authenticateToken, requireAdmin, createFollowUpAppointment);

/**
 * PATCH /api/appointments/:id/mark-review
 * Veterinario marca solicitud como "en revisión" (FLUJO A - Email 2/3)
 * 
 * Transición: requested → under_review
 */
router.patch('/:id/mark-review', authenticateToken, requireAdmin, markAsUnderReview);

/**
 * PATCH /api/appointments/:id/status
 * Actualizar estado de una cita (Modelo Semáforo)
 * 
 * Body: {
 *   status: "approved" | "confirmed" | "rejected" | "cancelled" | "completed",
 *   adminNotes: "Razón opcional del cambio"
 * }
 */
router.patch('/:id/status', authenticateToken, requireAdmin, updateAppointmentStatus);

/**
 * GET /api/appointments/pending
 * Obtener todas las citas pendientes para revisión
 */
router.get('/pending', authenticateToken, requireAdmin, getPendingAppointments);

/**
 * GET /api/appointments
 * Obtener todas las citas (con filtros opcionales)
 * 
 * Query params:
 *   - status: filtrar por estado
 *   - date: filtrar por fecha (YYYY-MM-DD)
 */
router.get('/', authenticateToken, getAllAppointments);

export default router;
