import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

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

import { setupChatHandlers } from './controllers/chatController.js';
import { initReminderService } from './services/reminderService.js';

console.log('✅ Imports successful');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: true, methods: ['GET', 'POST'], credentials: true }
});

console.log('✅ Server/Socket initialized');

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
console.log('✅ Middleware setup 1');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests'
});
app.use('/api/', limiter);
app.use(express.json());
console.log('✅ Middleware setup 2');

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

console.log('✅ Routes setup');

setupChatHandlers(io);
if (process.env.NODE_ENV !== 'test') {
    initReminderService();
}

console.log('✅ Services initialized');
console.log('🎉 EVERYTHING IS FINE. Server should run.');
