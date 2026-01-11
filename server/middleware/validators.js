import { z } from 'zod';

// ============================================================================
// SECURE VALIDATION SCHEMAS - Zero Trust Architecture
// ============================================================================

/**
 * Password Complexity Regex (OWASP Compliant)
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,}$/;

/**
 * Phone Number Regex (International E.164 Format)
 * - Optional + prefix
 * - 7-15 digits
 * - Allows spaces and hyphens for readability
 */
const PHONE_REGEX = /^\+?[\d\s\-]{7,20}$/;

/**
 * Name Sanitization
 * - Prevents script injection in names
 * - Allows letters, spaces, hyphens, apostrophes (for international names)
 */
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;

// ============================================================================
// REGISTRATION SCHEMA - Strict Security Validation
// ============================================================================
const registrationSchema = z.object({
    name: z
        .string({
            required_error: 'El nombre es requerido',
            invalid_type_error: 'El nombre debe ser texto'
        })
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .regex(
            NAME_REGEX,
            'El nombre solo puede contener letras, espacios, guiones y apóstrofes'
        ),

    email: z
        .string({
            required_error: 'El email es requerido',
            invalid_type_error: 'El email debe ser texto'
        })
        .email('Formato de email inválido')
        .trim()
        .toLowerCase() // Normalize to lowercase for consistency
        .max(255, 'El email no puede exceder 255 caracteres'),

    password: z
        .string({
            required_error: 'La contraseña es requerida',
            invalid_type_error: 'La contraseña debe ser texto'
        })
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(128, 'La contraseña no puede exceder 128 caracteres')
        .regex(
            PASSWORD_REGEX,
            'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (!@#$%^&*...)'
        ),

    phone: z.preprocess(
        (val) => {
            // Convert empty string to undefined
            if (val === '' || val === null) return undefined;
            return val;
        },
        z.string()
            .regex(PHONE_REGEX, 'Formato de teléfono inválido (use formato internacional +123456789)')
            .optional()
    )
});

// ============================================================================
// ADMIN REGISTRATION SCHEMA - With Invitation Code
// ============================================================================
const registerAdminSchema = z.object({
    name: z
        .string({
            required_error: 'El nombre es requerido',
            invalid_type_error: 'El nombre debe ser texto'
        })
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .regex(
            NAME_REGEX,
            'El nombre solo puede contener letras, espacios, guiones y apóstrofes'
        ),

    email: z
        .string({
            required_error: 'El email es requerido',
            invalid_type_error: 'El email debe ser texto'
        })
        .email('Formato de email inválido')
        .trim()
        .toLowerCase()
        .max(255, 'El email no puede exceder 255 caracteres'),

    password: z
        .string({
            required_error: 'La contraseña es requerida',
            invalid_type_error: 'La contraseña debe ser texto'
        })
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(128, 'La contraseña no puede exceder 128 caracteres')
        .regex(
            PASSWORD_REGEX,
            'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (!@#$%^&*...)'
        ),

    phone: z.preprocess(
        (val) => {
            if (val === '' || val === null) return undefined;
            return val;
        },
        z.string()
            .regex(PHONE_REGEX, 'Formato de teléfono inválido (use formato internacional +123456789)')
            .optional()
    ),

    // NEW: Invitation code required for admin registration
    invitationCode: z
        .string({
            required_error: 'El código de invitación es requerido',
            invalid_type_error: 'El código debe ser texto'
        })
        .trim()
        .min(1, 'El código de invitación es requerido')
        .max(64, 'Código de invitación inválido')
});

// ============================================================================
// LOGIN SCHEMA - Minimal Validation (Don't leak info)
// ============================================================================
const loginSchema = z.object({
    email: z
        .string({
            required_error: 'El email es requerido',
            invalid_type_error: 'El email debe ser texto'
        })
        .email('Formato de email inválido')
        .trim()
        .toLowerCase(),

    password: z
        .string({
            required_error: 'La contraseña es requerida',
            invalid_type_error: 'La contraseña debe ser texto'
        })
        .min(1, 'La contraseña es requerida')
});

// ============================================================================
// VALIDATION MIDDLEWARE - Generic Error Handler
// ============================================================================
/**
 * Generic validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
    try {
        // Parse and validate request body
        const validatedData = schema.parse(req.body);

        // Replace req.body with validated & sanitized data
        req.body = validatedData;

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Format validation errors for client consumption
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }));

            return res.status(400).json({
                success: false,
                error: 'Error de validación en los datos enviados',
                details: formattedErrors
            });
        }

        // Pass unexpected errors to global error handler
        next(error);
    }
};

// ============================================================================
// EXPORTED VALIDATORS
// ============================================================================
export const validateRegistration = validate(registrationSchema);
export const validateAdminRegistration = validate(registerAdminSchema);
export const validateLogin = validate(loginSchema);

// Export schemas for testing purposes
export { registrationSchema, registerAdminSchema, loginSchema };
