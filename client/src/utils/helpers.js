/**
 * Utility Functions
 * Funciones helper reutilizables en toda la aplicación
 */

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: 'USD')
 * @returns {string} Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'USD') => {
    if (isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Valida si existe un token de autenticación
 * @returns {boolean} True si existe token válido
 */
export const hasValidToken = () => {
    const token = localStorage.getItem('token');
    return token !== null && token !== undefined && token !== '';
};

/**
 * Obtiene el token de autenticación
 * @throws {Error} Si no existe token
 * @returns {string} Token de autenticación
 */
export const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
    }
    return token;
};

/**
 * Maneja errores de API de forma consistente
 * @param {Error} error - Error capturado
 * @param {string} defaultMessage - Mensaje por defecto
 * @returns {string} Mensaje de error amigable
 */
export const handleApiError = (error, defaultMessage = 'Ocurrió un error inesperado') => {
    if (error.response) {
        // El servidor respondió con un código de error
        return error.response.data?.message || error.response.data?.error || defaultMessage;
    } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else {
        // Error en la configuración de la petición
        return error.message || defaultMessage;
    }
};

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado con ...
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Descarga un archivo blob
 * @param {Blob} blob - Blob del archivo
 * @param {string} filename - Nombre del archivo
 */
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Valida email con regex
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
