import { pool } from '../config/db.js';
import NotificationService from '../services/notificationService.js';

/**
 * State Machine - Transiciones válidas entre estados de citas
 * 
 * Define qué cambios de estado son permitidos para mantener
 * la integridad del flujo de negocio.
 */
const VALID_TRANSITIONS = {
    // Flujo Cliente
    'requested': ['under_review', 'rejected', 'cancelled'],
    'under_review': ['confirmed', 'rejected', 'cancelled'],

    // Flujo Veterinario + Estados compartidos
    'confirmed': ['completed', 'cancelled'],

    // Legacy support
    'pending': ['approved', 'rejected', 'cancelled'],
    'approved': ['completed', 'cancelled'],

    // Estados finales
    'rejected': [],
    'completed': [],
    'cancelled': []
};

/**
 * Actualiza el estado de una cita y envía notificación por email
 * 
 * Este endpoint implementa el modelo de "Semáforo" para control de citas:
 * - 🟡 PENDING (pending): En revisión
 * - 🟢 APPROVED (approved): Confirmada
 * - 🔴 REJECTED (rejected): Rechazada, necesita reagendar
 * 
 * POLÍTICA DE TRANSACCIONALIDAD:
 * Si el envío de email falla, el cambio de estado SE MANTIENE.
 * El estado es la operación crítica de negocio, el email es secundario.
 * Los errores de email se loguean pero no revierten la transacción.
 */
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const adminId = req.user.id;  // From authenticateToken middleware

        // -----------------------------------------------------------------------
        // STEP 1: Validar estado solicitado
        // -----------------------------------------------------------------------
        // Actualizado para incluir estados del nuevo Dual Flow
        const validStatuses = ['approved', 'rejected', 'cancelled', 'completed', 'confirmed', 'under_review', 'requested'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`,
                error: 'INVALID_STATUS'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 2: Obtener cita actual y datos del cliente
        // -----------------------------------------------------------------------
        const appointmentResult = await pool.query(
            `SELECT a.*, u.email as client_email, u.full_name as client_name
             FROM appointments a
             JOIN users u ON a.client_id = u.id
             WHERE a.id = $1`,
            [id]
        );

        if (appointmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada',
                error: 'APPOINTMENT_NOT_FOUND'
            });
        }

        const appointment = appointmentResult.rows[0];

        // -----------------------------------------------------------------------
        // STEP 3: Validar transición de estado (State Machine)
        // -----------------------------------------------------------------------
        const currentStatus = appointment.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus];

        if (!allowedTransitions || !allowedTransitions.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Transición inválida: No se puede cambiar de "${currentStatus}" a "${status}"`,
                error: 'INVALID_STATE_TRANSITION',
                currentStatus,
                requestedStatus: status,
                allowedTransitions: allowedTransitions || []
            });
        }

        // -----------------------------------------------------------------------
        // STEP 4: Actualizar estado en base de datos
        // -----------------------------------------------------------------------
        const updateResult = await pool.query(
            `UPDATE appointments 
             SET status = $1, 
                 admin_notes = $2, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [status, adminNotes || null, id]
        );

        const updatedAppointment = updateResult.rows[0];

        // -----------------------------------------------------------------------
        // STEP 5: Enviar notificación por email (NON-BLOCKING)
        // -----------------------------------------------------------------------
        const client = {
            email: appointment.client_email,
            full_name: appointment.client_name
        };

        let emailSent = false;
        let emailError = null;

        try {
            // Determinar evento según el estado
            let event = null;

            if (status === 'approved' || status === 'confirmed') {
                // Verificar si es follow-up o solicitud de cliente
                event = appointment.created_by_admin ? null : 'APPOINTMENT_CONFIRMED_CLIENT';
            } else if (status === 'rejected') {
                event = 'APPOINTMENT_REJECTED';
            }

            if (event) {
                const result = await NotificationService.notifyAppointmentEvent(
                    event,
                    updatedAppointment,
                    client,
                    { reason: adminNotes }
                );
                emailSent = result && !result.error;
                console.log(`✅ Notificación enviada: ${event}`);
            }
        } catch (error) {
            // POLÍTICA: Email fallo NO revierte el cambio de estado
            emailError = error.message;
            console.error('❌ Error al enviar notificación (estado ya actualizado):', error);
            // NO throw - mantener el cambio de estado
        }

        // -----------------------------------------------------------------------
        // STEP 6: Retornar respuesta exitosa
        // -----------------------------------------------------------------------
        const statusMessages = {
            'approved': 'confirmada',
            'rejected': 'rechazada',
            'cancelled': 'cancelada',
            'completed': 'marcada como completada'
        };

        res.json({
            success: true,
            message: `Cita ${statusMessages[status]} exitosamente`,
            data: {
                appointment: {
                    id: updatedAppointment.id,
                    status: updatedAppointment.status,
                    appointmentDate: updatedAppointment.appointment_date,
                    appointmentTime: updatedAppointment.appointment_time,
                    serviceType: updatedAppointment.service_type,
                    adminNotes: updatedAppointment.admin_notes,
                    updatedAt: updatedAppointment.updated_at
                },
                notification: {
                    emailSent,
                    emailError: emailError || null
                }
            }
        });

    } catch (error) {
        console.error('Error en updateAppointmentStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar estado de cita',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
};

/**
 * Obtiene todas las citas pendientes (para dashboard de admin)
 */
export const getPendingAppointments = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, u.full_name as client_name, u.email as client_email, u.phone as client_phone,
                    p.name as pet_name, p.species as pet_species
             FROM appointments a
             JOIN users u ON a.client_id = u.id
             JOIN pets p ON a.pet_id = p.id
             WHERE a.status = 'pending'
             ORDER BY a.appointment_date ASC, a.appointment_time ASC`
        );

        res.json({
            success: true,
            data: {
                appointments: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        console.error('Error getting pending appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas pendientes',
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};

/**
 * Obtiene todas las citas (con filtros opcionales)
 */
export const getAllAppointments = async (req, res) => {
    try {
        const { status, date } = req.query;

        let query = `
            SELECT a.*, u.full_name as client_name, u.email as client_email, u.phone as client_phone,
                   p.name as pet_name, p.species as pet_species
            FROM appointments a
            JOIN users u ON a.client_id = u.id
            JOIN pets p ON a.pet_id = p.id
        `;

        const conditions = [];
        const params = [];

        // Si es cliente, solo ver sus propias citas
        if (req.user.role !== 'admin') {
            conditions.push(`a.client_id = $${params.length + 1}`);
            params.push(req.user.id);
        }

        if (status) {
            conditions.push(`a.status = $${params.length + 1}`);
            params.push(status);
        }

        if (date) {
            conditions.push(`a.appointment_date = $${params.length + 1}`);
            params.push(date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: {
                appointments: result.rows,
                count: result.rows.length,
                filters: { status, date }
            }
        });

    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas',
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};

// ============================================================================
// DUAL-FLOW APPOINTMENT SYSTEM - New Functions
// ============================================================================

/**
 * FLUJO A: requestAppointment - Cliente solicita cita
 * 
 * Permite a clientes solicitar citas que inician en estado 'requested'.
 * Envía email automático "Solicitud Recibida" (Email 1/3 del flujo cliente).
 */
export const requestAppointment = async (req, res) => {
    try {
        const { petId, appointmentDate, appointmentTime, serviceType, notes } = req.body;
        const clientId = req.user.id;  // From authenticateToken middleware

        console.log(`[REQUEST] New Appointment Request:`, { petId, clientId, date: appointmentDate });

        // Validar que la mascota existe y pertenece al cliente
        const petCheck = await pool.query(
            'SELECT id FROM pets WHERE id = $1 AND owner_id = $2',
            [petId, clientId]
        );

        if (petCheck.rows.length === 0) {
            console.log(`[ERROR] Ownership check failed for pet ${petId} and user ${clientId}`);
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para agendar citas para esta mascota',
                error: 'FORBIDDEN'
            });
        }

        // Crear cita en estado REQUESTED
        const result = await pool.query(
            `INSERT INTO appointments 
             (pet_id, client_id, appointment_date, appointment_time, service_type, notes, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'requested', CURRENT_TIMESTAMP)
             RETURNING *`,
            [petId, clientId, appointmentDate, appointmentTime, serviceType, notes || '']
        );

        const appointment = result.rows[0];

        // Obtener datos del cliente para email
        const clientResult = await pool.query(
            'SELECT full_name, email FROM users WHERE id = $1',
            [clientId]
        );
        const client = clientResult.rows[0];

        // NOTIFICACIÓN 1: "Solicitud Recibida"
        try {
            await NotificationService.notifyAppointmentEvent(
                'APPOINTMENT_REQUESTED',
                appointment,
                client
            );
            console.log(`📧 Email "Solicitud Recibida" enviado a ${client.email}`);
        } catch (emailError) {
            console.error('Email failed but appointment created:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Solicitud de cita creada exitosamente',
            data: {
                appointment,
                status: 'requested',
                nextStep: 'Un veterinario revisará tu solicitud pronto'
            }
        });

    } catch (error) {
        console.error('Error creating appointment request:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud de cita',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
};

/**
 * FLUJO B: createFollowUpAppointment - Veterinario agenda cita de control
 * 
 * Permite a veterinarios crear citas directamente en estado 'confirmed'.
 * Envía email ÚNICO "Control Programado" (flujo simplificado para vets).
 */
export const createFollowUpAppointment = async (req, res) => {
    try {
        const { petId, clientId, appointmentDate, appointmentTime, serviceType, notes } = req.body;
        const vetId = req.user.id;  // From authenticateToken + requireAdmin

        // Validar que cliente y mascota existen
        const [clientCheck, petCheck] = await Promise.all([
            pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [clientId]),
            pool.query('SELECT id FROM pets WHERE id = $1', [petId])
        ]);

        if (clientCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado',
                error: 'CLIENT_NOT_FOUND'
            });
        }

        if (petCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada',
                error: 'PET_NOT_FOUND'
            });
        }

        // Crear cita DIRECTAMENTE en estado CONFIRMED (skip revisión)
        const result = await pool.query(
            `INSERT INTO appointments 
             (pet_id, client_id, appointment_date, appointment_time, service_type, notes, status, created_by_admin, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, CURRENT_TIMESTAMP)
             RETURNING *`,
            [petId, clientId, appointmentDate, appointmentTime, serviceType, notes || '', vetId]
        );

        const appointment = result.rows[0];

        // Obtener nombre del veterinario para email
        const vetResult = await pool.query(
            'SELECT full_name FROM users WHERE id = $1',
            [vetId]
        );

        const client = clientCheck.rows[0];
        const vet = vetResult.rows[0];

        // NOTIFICACIÓN ÚNICA: "Control Programado"
        try {
            await NotificationService.notifyAppointmentEvent(
                'APPOINTMENT_CONFIRMED_FOLLOWUP',
                appointment,
                client,
                { vetName: vet.full_name }
            );
            console.log(`📧 Email "Control Programado" enviado a ${client.email}`);
        } catch (emailError) {
            console.error('Email failed but appointment created:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Cita de control creada exitosamente',
            data: {
                appointment,
                status: 'confirmed',
                createdBy: vet.full_name,
                notification: 'Cliente notificado por email'
            }
        });

    } catch (error) {
        console.error('Error creating follow-up appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cita de control',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
};

/**
 * markAsUnderReview - Veterinario abre/revisa solicitud
 * 
 * Transiciona cita de 'requested' a 'under_review'.
 * Envía email "En Revisión por Especialista" (Email 2/3 del flujo cliente).
 */
export const markAsUnderReview = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener cita actual con datos del cliente
        const appointmentResult = await pool.query(
            `SELECT a.*, u.email as client_email, u.full_name as client_name
             FROM appointments a
             JOIN users u ON a.client_id = u.id
             WHERE a.id = $1`,
            [id]
        );

        if (appointmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada',
                error: 'APPOINTMENT_NOT_FOUND'
            });
        }

        const appointment = appointmentResult.rows[0];

        // Validar que está en estado REQUESTED
        if (appointment.status !== 'requested') {
            return res.status(400).json({
                success: false,
                message: `La cita ya está en estado "${appointment.status}". Solo citas en "requested" pueden marcarse como "en revisión".`,
                error: 'INVALID_STATE',
                currentStatus: appointment.status
            });
        }

        // Cambiar a UNDER_REVIEW
        const updateResult = await pool.query(
            `UPDATE appointments 
             SET status = 'under_review', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        const updatedAppointment = updateResult.rows[0];

        const client = {
            email: appointment.client_email,
            full_name: appointment.client_name
        };

        // NOTIFICACIÓN 2: "En Revisión por Especialista"
        try {
            await NotificationService.notifyAppointmentEvent(
                'APPOINTMENT_UNDER_REVIEW',
                updatedAppointment,
                client
            );
            console.log(`📧 Email "En Revisión" enviado a ${client.email}`);
        } catch (emailError) {
            console.error('Email failed but status updated:', emailError);
        }

        res.json({
            success: true,
            message: 'Cita marcada como en revisión',
            data: {
                appointment: updatedAppointment,
                notification: 'Cliente notificado por email'
            }
        });

    } catch (error) {
        console.error('Error marking as under review:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de cita',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
};
