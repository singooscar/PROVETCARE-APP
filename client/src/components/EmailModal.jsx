import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';

const EmailModal = ({ isOpen, onClose, onSend, initialData, actionType }) => {
    const [emailData, setEmailData] = useState({
        to: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (initialData) {
            setEmailData({
                to: initialData.email || '',
                subject: initialData.subject || '',
                message: initialData.message || ''
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await onSend(emailData);
            onClose();
        } catch (error) {
            // Error manejado por el padre
        } finally {
            setSending(false);
        }
    };

    const getHeaderColor = () => {
        if (actionType === 'reject') return 'bg-red-600';
        if (actionType === 'confirm') return 'bg-green-600';
        return 'bg-blue-600';
    };

    const getTitle = () => {
        if (actionType === 'reject') return 'Rechazar Cita y Notificar';
        if (actionType === 'confirm') return 'Confirmar Cita y Notificar';
        return 'Enviar Correo';
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className={`${getHeaderColor()} px-6 py-4 flex justify-between items-center text-white`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {actionType === 'reject' && <AlertCircle size={20} />}
                        {getTitle()}
                    </h3>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-1 rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Destinatario (Solo lectura)
                        </label>
                        <input
                            type="email"
                            value={emailData.to}
                            readOnly
                            className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Asunto
                        </label>
                        <input
                            type="text"
                            value={emailData.subject}
                            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mensaje
                        </label>
                        <textarea
                            value={emailData.message}
                            onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                            rows="6"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none font-sans text-sm leading-relaxed"
                            required
                        ></textarea>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            Se enviará con el formato profesional de PROVETCARE
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                            disabled={sending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 py-2.5 text-white rounded-lg font-bold shadow-md transition flex justify-center items-center gap-2
                                ${actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                ${sending ? 'opacity-70 cursor-wait' : ''}
                            `}
                            disabled={sending}
                        >
                            {sending ? (
                                <span className="animate-pulse">Enviando...</span>
                            ) : (
                                <>
                                    <Send size={18} />
                                    {actionType === 'reject' ? 'Rechazar y Notificar' : 'Confirmar y Notificar'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailModal;
