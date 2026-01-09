import { pool } from '../config/db.js';

// Obtener todas las conversaciones del usuario
export const getConversations = async (req, res) => {
    try {
        let query;
        let params;

        if (req.user.role === 'admin') {
            // Admin ve todas las conversaciones
            query = `
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END as other_user_id,
          u.full_name,
          u.email,
          (SELECT message FROM chat_messages 
           WHERE (sender_id = $1 AND receiver_id = u.id) 
              OR (sender_id = u.id AND receiver_id = $1)
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM chat_messages 
           WHERE (sender_id = $1 AND receiver_id = u.id) 
              OR (sender_id = u.id AND receiver_id = $1)
           ORDER BY created_at DESC LIMIT 1) as last_message_date,
          (SELECT COUNT(*) FROM chat_messages 
           WHERE sender_id = u.id AND receiver_id = $1 AND is_read = false) as unread_count
        FROM chat_messages cm
        JOIN users u ON u.id = CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY last_message_date DESC
      `;
            params = [req.user.id];
        } else {
            // Cliente solo ve conversación con admin
            query = `
        SELECT 
          u.id as other_user_id,
          u.full_name,
          u.email,
          (SELECT message FROM chat_messages 
           WHERE (sender_id = $1 AND receiver_id = u.id) 
              OR (sender_id = u.id AND receiver_id = $1)
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM chat_messages 
           WHERE (sender_id = $1 AND receiver_id = u.id) 
              OR (sender_id = u.id AND receiver_id = $1)
           ORDER BY created_at DESC LIMIT 1) as last_message_date,
          (SELECT COUNT(*) FROM chat_messages 
           WHERE sender_id = u.id AND receiver_id = $1 AND is_read = false) as unread_count
        FROM users u
        WHERE u.role = 'admin'
        ORDER BY last_message_date DESC
      `;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
};

// Obtener mensajes de una conversación
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT cm.*, 
              sender.full_name as sender_name,
              receiver.full_name as receiver_name
       FROM chat_messages cm
       JOIN users sender ON cm.sender_id = sender.id
       JOIN users receiver ON cm.receiver_id = receiver.id
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
            [req.user.id, userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};

// Enviar un mensaje
export const sendMessage = async (req, res) => {
    try {
        const { receiver_id, message } = req.body;

        const result = await pool.query(
            `INSERT INTO chat_messages (sender_id, receiver_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [req.user.id, receiver_id, message]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

// Marcar mensajes como leídos
export const markAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        await pool.query(
            `UPDATE chat_messages 
       SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
            [userId, req.user.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error al marcar como leído:', error);
        res.status(500).json({ error: 'Error al marcar como leído' });
    }
};

// Configurar handlers de Socket.IO
export const setupChatHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`💬 Cliente conectado: ${socket.id}`);

        // Usuario se une a su sala personal
        socket.on('join', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`Usuario ${userId} se unió a su sala`);
        });

        // Enviar mensaje en tiempo real
        socket.on('send_message', async (data) => {
            try {
                const { sender_id, receiver_id, message } = data;

                // Guardar en base de datos
                const result = await pool.query(
                    `INSERT INTO chat_messages (sender_id, receiver_id, message)
           VALUES ($1, $2, $3)
           RETURNING *`,
                    [sender_id, receiver_id, message]
                );

                const newMessage = result.rows[0];

                // Obtener nombres de usuarios
                const usersResult = await pool.query(
                    `SELECT id, full_name FROM users WHERE id IN ($1, $2)`,
                    [sender_id, receiver_id]
                );

                const sender = usersResult.rows.find(u => u.id === sender_id);
                const receiver = usersResult.rows.find(u => u.id === receiver_id);

                const messageWithNames = {
                    ...newMessage,
                    sender_name: sender?.full_name,
                    receiver_name: receiver?.full_name
                };

                // Emitir a ambos usuarios
                io.to(`user_${sender_id}`).emit('new_message', messageWithNames);
                io.to(`user_${receiver_id}`).emit('new_message', messageWithNames);
            } catch (error) {
                console.error('Error al enviar mensaje via socket:', error);
                socket.emit('error', { message: 'Error al enviar mensaje' });
            }
        });

        // Usuario está escribiendo
        socket.on('typing', (data) => {
            const { receiver_id, sender_name } = data;
            io.to(`user_${receiver_id}`).emit('user_typing', { sender_name });
        });

        // Usuario dejó de escribir
        socket.on('stop_typing', (data) => {
            const { receiver_id } = data;
            io.to(`user_${receiver_id}`).emit('user_stop_typing');
        });

        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });
};
