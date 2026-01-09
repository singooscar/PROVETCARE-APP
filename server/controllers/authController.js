import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generar JWT
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET || 'provetcare_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ============================================================================
// REGISTER - Zero Trust Security Implementation
// ============================================================================
export const register = async (req, res) => {
    const startTime = Date.now(); // For timing-safe responses

    try {
        const { name, email, password, phone } = req.body;

        // -----------------------------------------------------------------------
        // STEP 1: Check if user exists (ANTI-ENUMERATION STRATEGY)
        // -----------------------------------------------------------------------
        // NOTE: We check existence but return GENERIC errors to prevent 
        // attackers from discovering which emails are registered
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            // SECURITY: Generic message - don't reveal that email exists
            // Add artificial delay to match timing of successful registration
            const elapsedTime = Date.now() - startTime;
            const minResponseTime = 200; // Minimum 200ms response time

            if (elapsedTime < minResponseTime) {
                await new Promise(resolve =>
                    setTimeout(resolve, minResponseTime - elapsedTime)
                );
            }

            return res.status(400).json({
                success: false,
                message: 'No se pudo completar el registro. Por favor, verifica tus datos.',
                error: 'REGISTRATION_FAILED'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 2: Hash Password with Enhanced Security
        // -----------------------------------------------------------------------
        // SECURITY: Bcrypt cost factor 12 (2026 OWASP recommendation)
        // Cost factor 10 = ~0.1s, Cost factor 12 = ~0.25s (acceptable for registration)
        const BCRYPT_COST_FACTOR = 12;

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
        } catch (hashError) {
            console.error('Bcrypt hashing failed:', hashError);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud. Intenta nuevamente.',
                error: 'PROCESSING_ERROR'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 3: Create User in Database (ATOMIC TRANSACTION)
        // -----------------------------------------------------------------------
        let result;
        try {
            result = await pool.query(
                `INSERT INTO users (full_name, email, password, phone, role) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id, full_name, email, phone, role, created_at`,
                [name, email, hashedPassword, phone || null, 'client']
            );
        } catch (dbError) {
            console.error('Database insertion failed:', dbError);

            // SECURITY: Check for unique constraint violation (duplicate email)
            // This can happen due to race conditions between SELECT and INSERT
            if (dbError.code === '23505') { // PostgreSQL unique violation code
                // Add timing delay to prevent enumeration
                const elapsedTime = Date.now() - startTime;
                const minResponseTime = 200;

                if (elapsedTime < minResponseTime) {
                    await new Promise(resolve =>
                        setTimeout(resolve, minResponseTime - elapsedTime)
                    );
                }

                return res.status(400).json({
                    success: false,
                    message: 'No se pudo completar el registro. Por favor, verifica tus datos.',
                    error: 'REGISTRATION_FAILED'
                });
            }

            // Generic error for other DB issues
            return res.status(500).json({
                success: false,
                message: 'Error al crear la cuenta. Por favor, intenta más tarde.',
                error: 'SERVER_ERROR'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 4: Generate JWT Token with Enhanced Security
        // -----------------------------------------------------------------------
        const user = result.rows[0];

        // SECURITY: Validate JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET not configured');
            return res.status(500).json({
                success: false,
                message: 'Error de configuración del servidor.',
                error: 'CONFIGURATION_ERROR'
            });
        }

        let token;
        try {
            token = generateToken(user.id, user.role);
        } catch (jwtError) {
            console.error('JWT generation failed:', jwtError);
            return res.status(500).json({
                success: false,
                message: 'Error al generar credenciales. Intenta iniciar sesión.',
                error: 'TOKEN_GENERATION_FAILED'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 5: Return Success Response (STRUCTURED ENVELOPE)
        // -----------------------------------------------------------------------
        // SECURITY: Never return password hash - only safe user data
        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    createdAt: user.created_at
                }
            }
        });

    } catch (error) {
        // -----------------------------------------------------------------------
        // GLOBAL ERROR HANDLER - Last Resort
        // -----------------------------------------------------------------------
        console.error('Unexpected error in register endpoint:', error);

        // SECURITY: Never leak stack traces or internal details to client
        res.status(500).json({
            success: false,
            message: 'Error inesperado en el servidor. Por favor, contacta soporte.',
            error: 'INTERNAL_SERVER_ERROR',
            // Only include details in development
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
};

// Login de usuario
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

// Verificar token
export const verifyToken = async (req, res) => {
    try {
        // El usuario ya fue agregado por el middleware de autenticación
        res.json({
            valid: true,
            user: req.user
        });
    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({ error: 'Error al verificar token' });
    }
};

// Obtener perfil
export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

// ============================================================================
// REGISTER ADMIN - Veterinarian Registration with Invitation Code
// ============================================================================
export const registerAdmin = async (req, res) => {
    const startTime = Date.now();

    try {
        const { name, email, password, phone, invitationCode } = req.body;

        // -----------------------------------------------------------------------
        // STEP 1: Validate Invitation Code
        // -----------------------------------------------------------------------
        console.log('[REGISTER_ADMIN] Attempting registration for:', email);
        console.log('[REGISTER_ADMIN] Using code:', invitationCode);

        const invitationResult = await pool.query(
            `SELECT id, is_used, expires_at 
             FROM invitation_codes 
             WHERE code = $1`,
            [invitationCode]
        );

        console.log('[REGISTER_ADMIN] Code found:', invitationResult.rows.length > 0);
        if (invitationResult.rows.length > 0) {
            console.log('[REGISTER_ADMIN] Code details:', invitationResult.rows[0]);
        }

        // Generic error for all invitation code failures (security)
        const genericError = {
            success: false,
            message: 'Código de invitación inválido o expirado.',
            error: 'INVALID_INVITATION'
        };

        if (invitationResult.rows.length === 0) {
            console.log('[REGISTER_ADMIN] Code does not exist');
            // Code doesn't exist - timing delay to prevent enumeration
            const elapsedTime = Date.now() - startTime;
            const minResponseTime = 200;

            if (elapsedTime < minResponseTime) {
                await new Promise(resolve =>
                    setTimeout(resolve, minResponseTime - elapsedTime)
                );
            }

            return res.status(400).json(genericError);
        }

        const invitation = invitationResult.rows[0];

        // Check if already used
        if (invitation.is_used) {
            const elapsedTime = Date.now() - startTime;
            const minResponseTime = 200;

            if (elapsedTime < minResponseTime) {
                await new Promise(resolve =>
                    setTimeout(resolve, minResponseTime - elapsedTime)
                );
            }

            return res.status(400).json(genericError);
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            const elapsedTime = Date.now() - startTime;
            const minResponseTime = 200;

            if (elapsedTime < minResponseTime) {
                await new Promise(resolve =>
                    setTimeout(resolve, minResponseTime - elapsedTime)
                );
            }

            return res.status(400).json(genericError);
        }

        // -----------------------------------------------------------------------
        // STEP 2: Check if user already exists (same as regular register)
        // -----------------------------------------------------------------------
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            const elapsedTime = Date.now() - startTime;
            const minResponseTime = 200;

            if (elapsedTime < minResponseTime) {
                await new Promise(resolve =>
                    setTimeout(resolve, minResponseTime - elapsedTime)
                );
            }

            return res.status(400).json({
                success: false,
                message: 'No se pudo completar el registro. Por favor, verifica tus datos.',
                error: 'REGISTRATION_FAILED'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 3: Hash Password (Bcrypt cost factor 12)
        // -----------------------------------------------------------------------
        const BCRYPT_COST_FACTOR = 12;

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
        } catch (hashError) {
            console.error('Bcrypt hashing failed:', hashError);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud. Intenta nuevamente.',
                error: 'PROCESSING_ERROR'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 4: Create Admin User
        // -----------------------------------------------------------------------
        let result;
        try {
            result = await pool.query(
                `INSERT INTO users (full_name, email, password, phone, role) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id, full_name, email, phone, role, created_at`,
                [name, email, hashedPassword, phone || null, 'admin']  // IMPORTANT: role = 'admin'
            );
        } catch (dbError) {
            console.error('Database insertion failed:', dbError);

            // Check for unique constraint violation (race condition)
            if (dbError.code === '23505') {
                const elapsedTime = Date.now() - startTime;
                const minResponseTime = 200;

                if (elapsedTime < minResponseTime) {
                    await new Promise(resolve =>
                        setTimeout(resolve, minResponseTime - elapsedTime)
                    );
                }

                return res.status(400).json({
                    success: false,
                    message: 'No se pudo completar el registro. Por favor, verifica tus datos.',
                    error: 'REGISTRATION_FAILED'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al crear la cuenta. Por favor, intenta más tarde.',
                error: 'SERVER_ERROR'
            });
        }

        const user = result.rows[0];

        // -----------------------------------------------------------------------
        // STEP 5: Mark Invitation Code as Used
        // -----------------------------------------------------------------------
        await pool.query(
            `UPDATE invitation_codes 
             SET is_used = TRUE, used_by = $1, used_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [user.id, invitation.id]
        );

        // -----------------------------------------------------------------------
        // STEP 6: Generate JWT Token
        // -----------------------------------------------------------------------
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET not configured');
            return res.status(500).json({
                success: false,
                message: 'Error de configuración del servidor.',
                error: 'CONFIGURATION_ERROR'
            });
        }

        let token;
        try {
            token = generateToken(user.id, user.role);
        } catch (jwtError) {
            console.error('JWT generation failed:', jwtError);
            return res.status(500).json({
                success: false,
                message: 'Error al generar credenciales. Intenta iniciar sesión.',
                error: 'TOKEN_GENERATION_FAILED'
            });
        }

        // -----------------------------------------------------------------------
        // STEP 7: Return Success Response
        // -----------------------------------------------------------------------
        res.status(201).json({
            success: true,
            message: 'Cuenta de veterinario creada exitosamente',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,  // Will be 'admin'
                    createdAt: user.created_at
                }
            }
        });

    } catch (error) {
        console.error('Unexpected error in registerAdmin:', error);

        res.status(500).json({
            success: false,
            message: 'Error inesperado en el servidor. Por favor, contacta soporte.',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                debug: error.message
            })
        });
    }
};

// ============================================================================
// GENERATE INVITATION CODE - Admin Only
// ============================================================================
export const generateInvitationCode = async (req, res) => {
    try {
        // Only admins can generate invitation codes
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para generar códigos de invitación',
                error: 'FORBIDDEN'
            });
        }

        // Generate UUID v4
        const code = crypto.randomUUID();

        // Set expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Insert into database
        const result = await pool.query(
            `INSERT INTO invitation_codes (code, created_by, expires_at) 
             VALUES ($1, $2, $3) 
             RETURNING id, code, expires_at, created_at`,
            [code, req.user.id, expiresAt]
        );

        const invitationData = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Código de invitación generado exitosamente',
            data: {
                code: invitationData.code,
                expiresAt: invitationData.expires_at,
                createdAt: invitationData.created_at,
                validFor: '7 días'
            }
        });

    } catch (error) {
        console.error('Error generating invitation code:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar código de invitación',
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};

