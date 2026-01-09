-- Generar un nuevo código de invitación manualmente
-- Ejecutar en pgAdmin
INSERT INTO invitation_codes (code, created_by, expires_at)
VALUES (
        'test-veterinario-2026-manual',
        NULL,
        CURRENT_TIMESTAMP + INTERVAL '7 days'
    );
-- Verificar
SELECT code,
    expires_at,
    is_used,
    CASE
        WHEN is_used = TRUE THEN '❌ USADO'
        ELSE '✅ DISPONIBLE'
    END as estado
FROM invitation_codes
WHERE code = 'test-veterinario-2026-manual';