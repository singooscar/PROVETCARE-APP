import express from 'express';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/conversations', getConversations);
router.get('/:userId/messages', getMessages);
router.post('/messages', sendMessage);
router.put('/:userId/read', markAsRead);

export default router;
