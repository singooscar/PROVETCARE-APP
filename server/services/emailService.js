import nodemailer from 'nodemailer';

/**
 * EmailService - Servicio de notificaciones por correo electrónico
 * 
 * Maneja el envío de correos para notificar cambios de estado en las citas.
 * Usa nodemailer con SMTP configurable desde variables de entorno.
 */
class EmailService {
    static transporter = null;

    /**
     * Inicializa el transportador de nodemailer con configuración SMTP
     */
    static async init() {
        if (this.transporter) return; // Ya inicializado

        this.transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Verificar conexión
        try {
            await this.transporter.verify();
            console.log('✅ Email service ready');
        } catch (error) {
            console.error('❌ Email service error:', error.message);
        }
    }

    /**
     * Envía notificación de cita en revisión (🟡 PENDING)
     */
    static async sendAppointmentUnderReview(appointment, client) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status { display: inline-block; padding: 8px 16px; background: #fbbf24; color: #78350f; border-radius: 4px; font-weight: bold; }
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
                        <h2>Cita en Revisión</h2>
                        <p>Estimado/a <strong>${client.full_name}</strong>,</p>
                        <p>Hemos recibido tu solicitud de cita veterinaria. Nuestro equipo está revisando la disponibilidad para la fecha y hora solicitadas.</p>
                        
                        <div class="details">
                            <h3>📋 Detalles de la Cita:</h3>
                            <ul>
                                <li><strong>Fecha:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('es-ES')}</li>
                                <li><strong>Hora:</strong> ${appointment.appointment_time}</li>
                                <li><strong>Servicio:</strong> ${appointment.service_type}</li>
                                ${appointment.notes ? `<li><strong>Notas:</strong> ${appointment.notes}</li>` : ''}
                            </ul>
                        </div>

                        <p style="text-align: center;">
                            <span class="status">🟡 EN REVISIÓN</span>
                        </p>

                        <p>Te notificaremos por este medio cuando la cita sea confirmada o si necesitamos que selecciones otro horario.</p>
                        <p>Gracias por confiar en PROVETCARE para el cuidado de tu mascota.</p>
                        
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
            subject: '🟡 Cita en Revisión - PROVETCARE',
            html: htmlContent
        });
    }

    /**
     * Envía notificación de cita confirmada (🟢 APPROVED)
     */
    static async sendAppointmentConfirmed(appointment, client) {
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
                        <h2>✅ ¡Cita Confirmada!</h2>
                        <p>Estimado/a <strong>${client.full_name}</strong>,</p>
                        <p>Nos complace informarte que tu cita ha sido <strong>confirmada</strong>.</p>
                        
                        <div class="details">
                            <h3>📋 Detalles de la Cita:</h3>
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
                            <h3>📌 Importante:</h3>
                            <ul>
                                <li>Por favor, llega <strong>10 minutos antes</strong> de tu cita</li>
                                <li>Trae la cartilla de vacunación de tu mascota</li>
                                <li>Si necesitas cancelar, háznoslo saber con mínimo 24 horas de anticipación</li>
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

    /**
     * Envía notificación de cita rechazada (🔴 REJECTED)
     */
    static async sendAppointmentRejected(appointment, client, reason) {
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
                    .cta { text-align: center; margin: 20px 0; }
                    .cta button { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
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
                        <p>Estimado/a <strong>${client.full_name}</strong>,</p>
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

                        <div class="cta">
                            <p><strong>Reagenda tu cita ingresando a tu cuenta en PROVETCARE</strong></p>
                        </div>

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

    /**
     * Método base para enviar correos
     */
    static async send({ to, subject, html }) {
        if (!this.transporter) {
            await this.init();
        }

        // Si no hay configuración de email, simular envío (desarrollo)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('📧 [EMAIL SIMULATED]:', subject, 'to', to);
            return { simulated: true };
        }

        const mailOptions = {
            from: `"PROVETCARE 🐾" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

export default EmailService;
