import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import io from 'socket.io-client';

export default function Chat() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Inicializar Socket.IO
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Conectado a Socket.IO');
            newSocket.emit('join', user.id);
        });

        newSocket.on('new_message', (message) => {
            // Actualizar mensajes si es de la conversación actual
            if (selectedUser &&
                (message.sender_id === selectedUser.other_user_id ||
                    message.receiver_id === selectedUser.other_user_id)) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
            // Actualizar lista de conversaciones
            fetchConversations();
        });

        newSocket.on('user_typing', ({ sender_name }) => {
            setIsTyping(true);
        });

        newSocket.on('user_stop_typing', () => {
            setIsTyping(false);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user.id, selectedUser]);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.other_user_id);
            markAsRead(selectedUser.other_user_id);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/chat/conversations');
            setConversations(response.data);

            // Si es cliente y no hay conversaciones, crear una con admin
            if (user.role === 'client' && response.data.length === 0) {
                // Crear conversación con primer admin disponible
                const adminsResponse = await api.get('/chat/conversations');
                if (adminsResponse.data.length > 0) {
                    setSelectedUser(adminsResponse.data[0]);
                }
            }
        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const response = await api.get(`/chat/messages/${userId}`);
            setMessages(response.data);
        } catch (error) {
            toast.error('Error al cargar mensajes');
            console.error(error);
        }
    };

    const markAsRead = async (userId) => {
        try {
            await api.patch(`/chat/messages/${userId}/read`);
            fetchConversations();
        } catch (error) {
            console.error('Error al marcar como leído:', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !selectedUser) return;

        // Enviar via Socket.IO
        socket.emit('send_message', {
            sender_id: user.id,
            receiver_id: selectedUser.other_user_id,
            message: newMessage.trim()
        });

        setNewMessage('');
        handleStopTyping();
    };

    const handleTyping = () => {
        if (socket && selectedUser) {
            socket.emit('typing', {
                receiver_id: selectedUser.other_user_id,
                sender_name: user.name
            });

            // Detener typing después de 2 segundos de inactividad
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                handleStopTyping();
            }, 2000);
        }
    };

    const handleStopTyping = () => {
        if (socket && selectedUser) {
            socket.emit('stop_typing', {
                receiver_id: selectedUser.other_user_id
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-purple-50 flex">
            {/* Sidebar de conversaciones */}
            <div className="w-80 bg-white border-r flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle size={24} />
                        Mensajes
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>No hay conversaciones</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.other_user_id}
                                onClick={() => setSelectedUser(conv)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?.other_user_id === conv.other_user_id ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-800 truncate">
                                                {conv.full_name}
                                            </h3>
                                            {conv.unread_count > 0 && (
                                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.last_message || 'No hay mensajes'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Header del chat */}
                        <div className="p-4 bg-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{selectedUser.full_name}</h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mensajes */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isMine = msg.sender_id === user.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isMine
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                : 'bg-white text-gray-800'
                                                }`}
                                        >
                                            <p className="break-words">{msg.message}</p>
                                            <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {formatTime(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 px-4 py-2 rounded-2xl">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input de mensaje */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 input"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="btn btn-primary"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                        <div className="text-center">
                            <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Selecciona una conversación
                            </h3>
                            <p className="text-gray-500">
                                Elige un usuario para comenzar a chatear
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
