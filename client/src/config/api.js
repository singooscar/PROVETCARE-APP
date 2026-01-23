/**
 * API Configuration
 * Centraliza la configuración de la API para evitar URLs hardcodeadas
 */

// Obtener la URL base de la API desde variables de entorno
// En producción, esto se configurará automáticamente
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Endpoints principales
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        PROFILE: '/api/auth/profile',
        VERIFY: '/api/auth/verify'
    },
    APPOINTMENTS: {
        LIST: '/api/appointments',
        CREATE: '/api/appointments',
        UPDATE: (id) => `/api/appointments/${id}`,
        DELETE: (id) => `/api/appointments/${id}`,
        APPROVE: (id) => `/api/appointments/${id}/approve`,
        REJECT: (id) => `/api/appointments/${id}/reject`
    },
    PETS: {
        LIST: '/api/pets',
        CREATE: '/api/pets',
        UPDATE: (id) => `/api/pets/${id}`,
        DELETE: (id) => `/api/pets/${id}`
    },
    MEDICAL_RECORDS: {
        BY_PET: (petId) => `/api/medical-records/pet/${petId}`,
        CREATE: '/api/medical-records',
        UPDATE: (id) => `/api/medical-records/${id}`
    },
    PRESCRIPTIONS: {
        CREATE: '/api/prescriptions',
        BY_PET: (petId) => `/api/prescriptions/pet/${petId}`,
        DOWNLOAD: (id) => `/api/prescriptions/${id}/download`
    },
    INVOICES: {
        CREATE: '/api/invoices',
        LIST: '/api/invoices',
        BY_ID: (id) => `/api/invoices/${id}`,
        DOWNLOAD: (id) => `/api/invoices/${id}/download`
    },
    BILLING: {
        PENDING: '/api/billing/pending',
        HISTORY: '/api/billing/history',
        PROCESS_PAYMENT: '/api/billing/process-payment',
        CHARGES: '/api/billing/charges'
    },
    INVENTORY: '/api/inventory',
    CHAT: {
        CONVERSATIONS: '/api/chat/conversations',
        MESSAGES: '/api/chat/messages',
        SEND: '/api/chat/messages'
    },
    ADMIN: {
        CLIENTS: '/api/admin/clients',
        STATS: '/api/admin/stats'
    }
};

// Headers helpers
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// URL helper
export const getFullUrl = (endpoint) => {
    return `${API_URL}${endpoint}`;
};
