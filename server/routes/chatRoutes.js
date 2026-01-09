import express from 'express';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de chat
router.get('/conversations', getConversations);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);
router.patch('/messages/:userId/read', markAsRead);

export default router;
