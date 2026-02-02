import nodemailer from 'nodemailer';

// Fix for ESM import issues with nodemailer
const createTransporter = nodemailer.createTransport || nodemailer.createTransporter || ((opts) => {
    throw new Error('Nodemailer createTransport not found in export');
});

/**
 * NotificationService - Orquestador Centralizado de Notificaciones
 * 
 * Servicio event-driven que maneja todas las notificaciones del sistema de citas.
 * Reemplaza la lógica dispersa de EmailService con un patrón centralizado.
 * 
 * Eventos Soportados:
 * - APPOINTMENT_REQUESTED: Cliente solicita cita
 * - APPOINTMENT_UNDER_REVIEW: Veterinario abre solicitud
 * - APPOINTMENT_CONFIRMED_CLIENT: Vet aprueba solicitud de cliente
 * - APPOINTMENT_CONFIRMED_FOLLOWUP: Vet agenda cita de control
 * - APPOINTMENT_REJECTED: Vet rechaza solicitud
 */
class NotificationService {
    static transporter = null;

    /**
     * Inicializa el transportador de nodemailer con configuración SMTP
     */
    static async init() {
        if (this.transporter) return;

        this.transporter = createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        try {
            await this.transporter.verify();
            console.log('✅ NotificationService ready');
        } catch (error) {
            console.error('❌ NotificationService error:', error.message);
        }
    }

    // =========================================================================
    // EVENTO: APPOINTMENT_REQUESTED (Cliente solicita cita)
    // Email 1 de 3 en el flujo de cliente
    // =========================================================================
    static async sendRequestedEmail(appointment, client) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-weight: bold; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 PROVETCARE</h1>
                    </div>
                    <div class="content">
                        <h2>✅ Solicitud Recibida</h2>
                        <p>Hola <strong>${client.full_name}</strong>,</p>
                        <p>Hemos recibido tu solicitud de cita veterinaria. Estamos procesando tu petición.</p>
                        
                        <div class="details">
                            <h3>📋 Detalles de tu Solicitud:</h3>
                            <ul>
                                <li><strong>Fecha solicitada:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES')}</li>
                                <li><strong>Hora solicitada:</strong> ${appointment.appointment_time}</li>
                                <li><strong>Tipo de servicio:</strong> ${appointment.service_type}</li>
                            </ul>
                        </div>

                        <p style="text-align: center;">
                            <span class="status">📝 SOLICITADA</span>
                        </p>

                        <p>Un veterinario revisará tu solicitud pronto y te notificaremos sobre el estado de tu cita.</p>
                        
                        <div class="footer">
                            <p>PROVETCARE - Sistema de Citas Veterinarias</p>
                            <p>Este es un correo automático, por favor no responder.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.send({
            to: client.email,
            subject: '✅ Solicitud de Cita Recibida - PROVETCARE',
            html: htmlContent
        });
    }

    // =========================================================================
    // EVENTO: APPOINTMENT_UNDER_REVIEW (Veterinario abre/revisa solicitud)
    // Email 2 de 3 en el flujo de cliente
    // =========================================================================
    static async sendUnderReviewEmail(appointment, client) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #fef3c7; color: #78350f; border-radius: 4px; font-weight: bold; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 PROVETCARE</h1>
                    </div>
                    <div class="content">
                        <h2>👀 Tu Cita Está Siendo Revisada</h2>
                        <p>Hola <strong>${client.full_name}</strong>,</p>
                        <p>Un veterinario especialista está revisando tu solicitud de cita en este momento.</p>
                        
                        <div class="details">
                            <h3>📋 Cita en Revisión:</h3>
                            <ul>
                                <li><strong>Fecha:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES')}</li>
                                <li><strong>Hora:</strong> ${appointment.appointment_time}</li>
                                <li><strong>Servicio:</strong> ${appointment.service_type}</li>
                            </ul>
                        </div>

                        <p style="text-align: center;">
                            <span class="status">🟡 EN REVISIÓN POR ESPECIALISTA</span>
                        </p>

                        <p>Te notificaremos pronto si tu cita es confirmada o si necesitamos que selecciones otra fecha/hora.</p>
                        
                        <div class="footer">
                            <p>PROVETCARE - Sistema de Citas Veterinarias</p>
                            <p>Este es un correo automático, por favor no responder.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.send({
            to: client.email,
            subject: '👀 Tu Cita Está en Revisión - PROVETCARE',
            html: htmlContent
        });
    }

    // =========================================================================
    // EVENTO: APPOINTMENT_CONFIRMED_CLIENT (Vet aprueba solicitud de cliente)
    // Email 3 de 3 en el flujo de cliente
    // =========================================================================
    static async sendConfirmedClientEmail(appointment, client) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #34d399; color: #064e3b; border-radius: 4px; font-weight: bold; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #10b981; }
                    .important { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 PROVETCARE</h1>
                    </div>
                    <div class="content">
                        <h2>✅ ¡Tu Cita Ha Sido Confirmada!</h2>
                        <p>Hola <strong>${client.full_name}</strong>,</p>
                        <p>Nos complace informarte que tu solicitud de cita ha sido <strong>confirmada</strong> por nuestro equipo veterinario.</p>
                        
                        <div class="details">
                            <h3>📋 Detalles de tu Cita:</h3>
                            <ul>
                                <li><strong>Fecha:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                                <li><strong>Hora:</strong> ${appointment.appointment_time}</li>
                                <li><strong>Servicio:</strong> ${appointment.service_type}</li>
                            </ul>
                        </div>

                        <p style="text-align: center;">
                            <span class="status">🟢 CONFIRMADA</span>
                        </p>

                        <div class="important">
                            <h3>📌 Importante - Por Favor Recuerda:</h3>
                            <ul>
                                <li>Llega <strong>10 minutos antes</strong> de tu cita</li>
                                <li>Trae la cartilla de vacunación de tu mascota</li>
                                <li>Si necesitas cancelar, avísanos con 24 horas de anticipación</li>
                            </ul>
                        </div>

                        <p>¡Te esperamos en nuestra clínica veterinaria!</p>
                        
                        <div class="footer">
                            <p>PROVETCARE - Sistema de Citas Veterinarias</p>
                            <p>Este es un correo automático, por favor no responder.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.send({
            to: client.email,
            subject: '✅ Cita Confirmada - PROVETCARE',
            html: htmlContent
        });
    }

    // =========================================================================
    // EVENTO: APPOINTMENT_CONFIRMED_FOLLOWUP (Vet agenda cita de control)
    // Email ÚNICO en el flujo de veterinario
    // =========================================================================
    static async sendFollowUpScheduledEmail(appointment, client, vetName) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #c4b5fd; color: #5b21b6; border-radius: 4px; font-weight: bold; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                    .vet-info { background: #ede9fe; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 PROVETCARE</h1>
                    </div>
                    <div class="content">
                        <h2>📅 Control Médico Programado</h2>
                        <p>Hola <strong>${client.full_name}</strong>,</p>
                        <p>El <strong>Dr. ${vetName}</strong> ha programado una cita de control médico para tu mascota.</p>
                        
                        <div class="vet-info">
                            <p>👨‍⚕️ <strong>Veterinario asignado:</strong> Dr. ${vetName}</p>
                        </div>

                        <div class="details">
                            <h3>📋 Detalles de la Cita:</h3>
                            <ul>
                                <li><strong>Fecha:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                                <li><strong>Hora:</strong> ${appointment.appointment_time}</li>
                                <li><strong>Tipo:</strong> ${appointment.service_type}</li>
                                ${appointment.notes ? `<li><strong>Observaciones:</strong> ${appointment.notes}</li>` : ''}
                            </ul>
                        </div>

                        <p style="text-align: center;">
                            <span class="status">🟢 CITA CONFIRMADA</span>
                        </p>

                        <p>Esta cita de seguimiento es importante para verificar el estado de salud de tu mascota. Por favor, asiste puntualmente.</p>
                        <p><strong>Recuerda:</strong> Llega 10 minutos antes y trae la cartilla de vacunación.</p>
                        
                        <div class="footer">
                            <p>PROVETCARE - Sistema de Citas Veterinarias</p>
                            <p>Este es un correo automático, por favor no responder.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.send({
            to: client.email,
            subject: '📅 Cita de Control Programada - PROVETCARE',
            html: htmlContent
        });
    }

    // =========================================================================
    // EVENTO: APPOINTMENT_REJECTED (Vet rechaza solicitud)
    // =========================================================================
    static async sendRejectedEmail(appointment, client, reason) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #fca5a5; color: #7f1d1d; border-radius: 4px; font-weight: bold; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #ef4444; }
                    .reason { background: #fee2e2; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 PROVETCARE</h1>
                    </div>
                    <div class="content">
                        <h2>Cita No Disponible</h2>
                        <p>Hola <strong>${client.full_name}</strong>,</p>
                        <p>Lamentablemente, no podemos atender tu solicitud en la fecha y hora seleccionadas.</p>
                        
                        <div class="details">
                            <h3>📋 Detalles de la Solicitud:</h3>
                            <ul>
                                <li><strong>Fecha solicitada:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES')}</li>
                                <li><strong>Hora solicitada:</strong> ${appointment.appointment_time}</li>
                                <li><strong>Servicio:</strong> ${appointment.service_type}</li>
                            </ul>
                        </div>

                        ${reason ? `
                        <div class="reason">
                            <h3>💬 Motivo:</h3>
                            <p>${reason}</p>
                        </div>
                        ` : ''}

                        <p style="text-align: center;">
                            <span class="status">🔴 NO DISPONIBLE</span>
                        </p>

                        <p>Te invitamos a seleccionar una nueva fecha y hora que se ajuste mejor a nuestra disponibilidad.</p>
                        <p><strong>Puedes agendar una nueva cita</strong> ingresando a tu cuenta en PROVETCARE.</p>

                        <p>Disculpa las molestias. Estamos comprometidos en brindarte el mejor servicio para el cuidado de tu mascota.</p>
                        
                        <div class="footer">
                            <p>PROVETCARE - Sistema de Citas Veterinarias</p>
                            <p>Este es un correo automático, por favor no responder.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.send({
            to: client.email,
            subject: '🔴 Cita No Disponible - PROVETCARE',
            html: htmlContent
        });
    }

    // =========================================================================
    // EVENTO: PRESCRIPTION_ISSUED (Receta Médica Generada)
    // =========================================================================
    static async sendPrescriptionEmail(prescription, client, pdfPath) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #c4b5fd; color: #5b21b6; border-radius: 4px; font-weight: bold; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                    .important { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 PROVETCARE</h1>
                    </div>
                    <div class="content">
                        <h2>💊 Receta Médica Generada</h2>
                        <p>Hola <strong>${client.full_name}</strong>,</p>
                        <p>El veterinario ha generado una receta médica para tu mascota <strong>${prescription.petName}</strong>.</p>
                        
                        <div class="details">
                            <h3>📋 Detalles de la Receta:</h3>
                            <ul>
                                <li><strong>Receta #:</strong> ${prescription.id}</li>
                                <li><strong>Mascota:</strong> ${prescription.petName}</li>
                                <li><strong>Veterinario:</strong> Dr. ${prescription.vetName}</li>
                                <li><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                            </ul>
                        </div>

                        <p style="text-align: center;">
                            <span class="status">📄 RECETA ADJUNTA</span>
                        </p>

                        <div class="important">
                            <h3>📌 Importante:</h3>
                            <ul>
                                <li>Encontrarás el PDF de la receta adjunto a este correo</li>
                                <li>Sigue las indicaciones del veterinario al pie de la letra</li>
                                <li>Si tienes dudas, consulta con tu veterinario</li>
                                <li>Guarda este documento para futuras consultas</li>
                            </ul>
                        </div>
                        
                        <div class="footer">
                            <p>PROVETCARE - Sistema de Citas Veterinarias</p>
                            <p>Este es un correo automático, por favor no responder.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendWithAttachment({
            to: client.email,
            subject: '💊 Receta Médica - PROVETCARE',
            html: htmlContent,
            attachmentPath: pdfPath
        });
    }

    // =========================================================================
    // ORQUESTADORES PRINCIPALES
    // =========================================================================
    /**
     * Método principal para enviar notificaciones basadas en eventos
     * @param {string} event - Tipo de evento
     * @param {object} appointment - Datos de la cita
     * @param {object} client - Datos del cliente
     * @param {object} metadata - Metadata adicional (vetName, reason, etc.)
     */
    static async notifyAppointmentEvent(event, appointment, client, metadata = {}) {
        try {
            console.log(`📧 Dispatching notification: ${event}`);

            switch (event) {
                case 'APPOINTMENT_REQUESTED':
                    return await this.sendRequestedEmail(appointment, client);

                case 'APPOINTMENT_UNDER_REVIEW':
                    return await this.sendUnderReviewEmail(appointment, client);

                case 'APPOINTMENT_CONFIRMED_CLIENT':
                    return await this.sendConfirmedClientEmail(appointment, client);

                case 'APPOINTMENT_CONFIRMED_FOLLOWUP':
                    return await this.sendFollowUpScheduledEmail(appointment, client, metadata.vetName);

                case 'APPOINTMENT_REJECTED':
                    return await this.sendRejectedEmail(appointment, client, metadata.reason);

                default:
                    console.warn(`⚠️ Unknown notification event: ${event}`);
                    return null;
            }
        } catch (error) {
            console.error(`❌ Notification failed for event "${event}":`, error.message);
            // NON-BLOCKING: No lanzar error para no interrumpir operación crítica
            return { error: error.message, event };
        }
    }

    /**
     * Método para notificaciones de recetas médicas
     * @param {string} event - Tipo de evento (PRESCRIPTION_ISSUED)
     * @param {object} prescription - Datos de la receta
     * @param {object} client - Datos del cliente
     * @param {object} metadata - Metadata (pdfPath)
     */
    static async notifyPrescriptionEvent(event, prescription, client, metadata = {}) {
        try {
            console.log(`📧 Dispatching prescription notification: ${event}`);

            switch (event) {
                case 'PRESCRIPTION_ISSUED':
                    return await this.sendPrescriptionEmail(prescription, client, metadata.pdfPath);

                default:
                    console.warn(`⚠️ Unknown prescription event: ${event}`);
                    return null;
            }
        } catch (error) {
            console.error(`❌ Prescription notification failed:`, error.message);
            return { error: error.message, event };
        }
    }

    /**
     * Método base para enviar correos
     */
    static async send({ to, subject, html }) {
        if (!this.transporter) {
            await this.init();
        }

        // Modo desarrollo - simular envío si no hay credenciales
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log(`📧 [EMAIL SIMULATED]: ${subject} → ${to}`);
            return { simulated: true, to, subject };
        }

        const mailOptions = {
            from: `"PROVETCARE 🐾" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        return await this.transporter.sendMail(mailOptions);
    }

    /**
     * Método para enviar correos con archivos adjuntos
     */
    static async sendWithAttachment({ to, subject, html, attachmentPath }) {
        if (!this.transporter) {
            await this.init();
        }

        // Modo desarrollo - simular envío
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log(`📧 [EMAIL WITH ATTACHMENT SIMULATED]: ${subject} → ${to}`);
            console.log(`📎 Attachment: ${attachmentPath}`);
            return { simulated: true, to, subject, attachment: attachmentPath };
        }

        // Construir ruta completa del archivo
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const fullPath = path.join(__dirname, '../..', attachmentPath);

        const mailOptions = {
            from: `"PROVETCARE 🐾" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments: [
                {
                    filename: path.basename(attachmentPath),
                    path: fullPath,
                    contentType: 'application/pdf'
                }
            ]
        };

        console.log(`📎 Enviando email con PDF adjunto: ${path.basename(attachmentPath)}`);
        return await this.transporter.sendMail(mailOptions);
    }
}

export default NotificationService;
