-- Verificar códigos de invitación existentes
SELECT id,
    code,
    created_by,
    used_by,
    is_used,
    expires_at,
    created_at,
    used_at,
    CASE
        WHEN expires_at < CURRENT_TIMESTAMP THEN '❌ EXPIRADO'
        WHEN is_used = TRUE THEN '❌ YA USADO'
        ELSE '✅ VÁLIDO'
    END as estado
FROM invitation_codes
ORDER BY created_at DESC;