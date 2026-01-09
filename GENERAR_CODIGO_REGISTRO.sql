-- 1. Crear tabla de códigos de invitación si no existe
CREATE TABLE IF NOT EXISTS invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Insertar nuevo código para veterinarios (VET2026)
-- Este código expira en 7 días
INSERT INTO invitation_codes (code, is_used, expires_at)
VALUES (
        'VET2026',
        FALSE,
        NOW() + INTERVAL '7 days'
    ) ON CONFLICT (code) DO
UPDATE
SET expires_at = NOW() + INTERVAL '7 days',
    is_used = FALSE;
-- 3. Verificar creación
SELECT *
FROM invitation_codes
WHERE code = 'VET2026';