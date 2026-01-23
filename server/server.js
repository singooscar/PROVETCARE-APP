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
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

// Importar servicios
import { setupChatHandlers } from './controllers/chatController.js';
import { initReminderService } from './services/reminderService.js';
import { pool } from './config/db.js';

import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);

// ============================================================================
// CONFIGURACIÓN DE CORS
// ============================================================================
// Lista blanca de orígenes permitidos (SEGURIDAD MEJORADA)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir requests sin origin (ej: mobile apps, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por política CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.IO con CORS seguro
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================================
app.use(helmet()); // Headers de seguridad
app.use(cors(corsOptions)); // CORS configurado

// Rate limiting global
// En desarrollo: límites más altos para evitar bloqueos
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

const limiter = rateLimit({
    windowMs: isDevelopment
        ? 1 * 60 * 1000  // 1 minuto en desarrollo
        : (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000), // 15 min en producción
    max: isDevelopment
        ? 1000  // 1000 requests en desarrollo
        : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // 100 en producción
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Saltar rate limiting para health check
        return req.path === '/api/health';
    }
});

app.use('/api/', limiter);

// Parseo de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// ARCHIVOS ESTÁTICOS
// ============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================================
// RUTAS DE DESARROLLO (SOLO DEV/TEST)
// ============================================================================
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    /**
     * ⚠️ ENDPOINT DE DESARROLLO - NO USAR EN PRODUCCIÓN
     * Genera token de admin para testing rápido
     */
    app.get('/api/dev-token', (req, res) => {
        console.warn('⚠️  Generando token de desarrollo - SOLO PARA DEV/TEST');
        const token = jwt.sign(
            { userId: 10, role: 'admin' },
            process.env.JWT_SECRET || 'provetcare_secret_key',
            { expiresIn: '1h' }
        );
        res.json({
            token,
            warning: 'Este endpoint solo está disponible en desarrollo'
        });
    });
}

// ============================================================================
// HEALTH CHECK (Sin autenticación requerida)
// ============================================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PROVETCARE API funcionando correctamente',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// RUTAS API
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', ecosystemRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);


// ============================================================================
// SOCKET.IO
// ============================================================================
setupChatHandlers(io);

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================
// Error handler global
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    // No revelar detalles de error en producción
    const errorResponse = {
        error: err.message || 'Error interno del servidor',
        status: err.status || 500
    };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(err.status || 500).json(errorResponse);
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================
httpServer.listen(PORT, () => {
    console.log('============================================');
    console.log(`✅ PROVETCARE Server v1.0.0`);
    console.log(`🌐 Corriendo en puerto ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`💬 Socket.io: Configurado`);
    console.log(`🔒 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('============================================');

    // Iniciar servicio de recordatorios (solo en producción/desarrollo)
    if (process.env.NODE_ENV !== 'test') {
        try {
            initReminderService();
            console.log('📧 Servicio de recordatorios: Activo');
        } catch (error) {
            console.error('⚠️  Error iniciando recordatorios:', error.message);
        }
    }
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
/**
 * Maneja el cierre graceful del servidor
 * Cierra conexiones HTTP, Socket.io y Pool de BD
 */
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} recibido, cerrando servidor...`);

    try {
        // 1. Cerrar servidor HTTP (no acepta nuevas conexiones)
        httpServer.close(() => {
            console.log('✅ Servidor HTTP cerrado');
        });

        // 2. Cerrar pool de base de datos
        await pool.end();
        console.log('✅ Pool de PostgreSQL cerrado');

        // 3. Cerrar Socket.io
        io.close(() => {
            console.log('✅ Socket.io cerrado');
        });

        console.log('👋 Servidor cerrado correctamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error durante cierre graceful:', error);
        process.exit(1);
    }
};

// Escuchar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;

