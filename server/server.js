import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Cargar variables de entorno
dotenv.config();

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import petRoutes from './routes/petRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ecosystemRoutes from './routes/ecosystemRoutes.js';

// Importar servicios
import { setupChatHandlers } from './controllers/chatController.js';
import { initReminderService } from './services/reminderService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: true, // Permite cualquier origen (dinámico para tunnel)
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: true, // Permite cualquier origen (dinámico para tunnel)
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
});

app.use('/api/', limiter);

// Parseo de body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
import jwt from 'jsonwebtoken'; // Necesario para el hack
// Backdoor temporal para tests (SOLO DEV)
app.get('/api/dev-token', (req, res) => {
    // Generate token for admin ID 10 (Dr. Juan)
    const token = jwt.sign(
        { userId: 10, role: 'admin' },
        process.env.JWT_SECRET || 'provetcare_secret_key',
        { expiresIn: '1h' }
    );
    res.json({ token });
});
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', ecosystemRoutes);
app.use('/api/chat', chatRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PROVETCARE API funcionando correctamente' });
});

// Configurar Socket.IO para chat
setupChatHandlers(io);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
    console.log(`✅ Servidor PROVETCARE corriendo en puerto ${PORT}`);
    console.log(`🌐 API disponible en http://localhost:${PORT}/api`);
    console.log(`💬 Socket.io configurado para chat en tiempo real`);

    // Iniciar servicio de recordatorios
    if (process.env.NODE_ENV !== 'test') {
        initReminderService();
        console.log('📧 Servicio de recordatorios inicializado');
    }
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    httpServer.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...');
    httpServer.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

export default app;
