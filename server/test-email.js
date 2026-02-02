import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 PROBANDO SERVICIO DE EMAIL\n');
console.log('Configuración:');
console.log(`- Host: ${process.env.EMAIL_HOST}`);
console.log(`- Port: ${process.env.EMAIL_PORT}`);
console.log(`- User: ${process.env.EMAIL_USER}`);
console.log(`- Password: ${process.env.EMAIL_PASSWORD ? '***configurado***' : '❌ NO configurado'}\n`);

async function testEmail() {
    try {
        console.log('1️⃣ Creando transportador de email...');

        const transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        console.log('2️⃣ Verificando conexión con servidor SMTP...');
        await transporter.verify();
        console.log('✅ Conexión establecida correctamente\n');

        console.log('3️⃣ Enviando email de prueba...');
        const result = await transporter.sendMail({
            from: `"PROVETCARE 🐾" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: '✅ Prueba de Email - PROVETCARE',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🐾 PROVETCARE</h1>
                        </div>
                        <div class="content">
                            <div class="success">
                                ✅ ¡El servicio de email funciona correctamente!
                            </div>
                            <h2>Prueba Exitosa</h2>
                            <p>Este correo es una prueba del sistema de notificaciones de PROVETCARE.</p>
                            <p><strong>Fecha de prueba:</strong> ${new Date().toLocaleString('es-ES')}</p>
                            <p><strong>Servidor SMTP:</strong> ${process.env.EMAIL_HOST}</p>
                            <h3>Funcionalidades disponibles:</h3>
                            <ul>
                                <li>✅ Notificaciones de citas en revisión</li>
                                <li>✅ Confirmación de citas</li>
                                <li>✅ Notificación de citas rechazadas</li>
                                <li>✅ Recordatorios automáticos (24h antes)</li>
                            </ul>
                            <p style="margin-top: 20px; padding: 10px; background: #fef3c7; border-radius: 4px;">
                                💡 <strong>Nota:</strong> Si recibiste este email, significa que el sistema está completamente funcional.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE!');
        console.log('Detalles:');
        console.log(`- Message ID: ${result.messageId}`);
        console.log(`- Enviado a: ${result.accepted.join(', ')}`);
        console.log(`- Rechazados: ${result.rejected.length > 0 ? result.rejected.join(', ') : 'Ninguno'}`);

        console.log('\n📬 Revisa tu bandeja de entrada:', process.env.EMAIL_USER);
        console.log('\n🎉 ¡PRUEBA COMPLETADA CON ÉXITO!');

    } catch (error) {
        console.error('\n❌ ERROR AL ENVIAR EMAIL:');
        console.error('Mensaje:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n🔐 SOLUCIÓN: Error de autenticación');
            console.error('1. Ve a https://myaccount.google.com/apppasswords');
            console.error('2. Genera una contraseña de aplicación');
            console.error('3. Actualiza EMAIL_PASSWORD en .env con esa contraseña');
        } else if (error.code === 'ECONNECTION') {
            console.error('\n🌐 SOLUCIÓN: Error de conexión');
            console.error('Verifica tu conexión a internet');
        } else {
            console.error('Stack:', error.stack);
        }
    }
}

testEmail();
