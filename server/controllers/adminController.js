import { pool } from '../config/db.js';

// Obtener todos los clientes con sus mascotas (para selects en frontend)
export const getClientsWithPets = async (req, res) => {
    try {
        // Obtenemos usuarios con rol client y sus mascotas
        const result = await pool.query(`
            SELECT 
                u.id as client_id,
                u.full_name as client_name,
                u.email as client_email,
                u.phone as client_phone,
                json_agg(
                    json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'species', p.species,
                        'breed', p.breed
                    ) ORDER BY p.name ASC
                ) FILTER (WHERE p.id IS NOT NULL) as pets
            FROM users u
            LEFT JOIN pets p ON u.id = p.owner_id
            WHERE u.role = 'client'
            GROUP BY u.id, u.full_name, u.email
            ORDER BY u.full_name ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error al obtener clientes con mascotas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la lista de clientes'
        });
    }
};

// Dashboard Stats (Resumen para la pantalla principal)
export const getDashboardStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM appointments WHERE status = 'requested') as pending_requests,
                (SELECT COUNT(*) FROM appointments WHERE status = 'under_review') as under_review,
                (SELECT COUNT(*) FROM appointments WHERE date(appointment_date) = CURRENT_DATE AND status = 'confirmed') as today_appointments,
                (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients
        `);

        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error al cargar estadísticas' });
    }
};

/**
 * Enviar correo personalizado desde el panel admin
 * POST /api/admin/send-custom-email
 */
import NotificationService from '../services/notificationService.js';

export const sendCustomEmail = async (req, res) => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios (to, subject, message)'
            });
        }

        console.log(`📧 Enviando correo personalizado a ${to}...`);

        // Usar NotificationService para enviar el correo
        await NotificationService.send({
            to,
            subject,
            html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`
        });

        res.json({
            success: true,
            message: 'Correo enviado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error enviando correo personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el correo. Verifica la configuración SMTP.',
            error: error.message
        });
    }
};
