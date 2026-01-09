-- ============================================================================
-- COPIAR Y PEGAR EN pgAdmin - Query Tool
-- Base de datos: provetcare_db
-- ============================================================================
-- Crear tabla invitation_codes
CREATE TABLE IF NOT EXISTS invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE
    SET NULL,
        used_by INTEGER REFERENCES users(id) ON DELETE
    SET NULL,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
);
-- Crear índices
CREATE INDEX IF NOT EXISTS idx_invitation_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_unused ON invitation_codes(is_used, expires_at);
-- Insertar código bootstrap (válido por 30 días)
INSERT INTO invitation_codes (code, created_by, expires_at)
VALUES (
        'bootstrap-admin-2026-provetcare',
        1,
        CURRENT_TIMESTAMP + INTERVAL '30 days'
    ) ON CONFLICT (code) DO NOTHING;
-- Verificar que funcionó
SELECT '✅ TABLA CREADA EXITOSAMENTE' as status,
    code as codigo_bootstrap,
    expires_at as expira_en,
    is_used as esta_usado
FROM invitation_codes
WHERE code = 'bootstrap-admin-2026-provetcare';