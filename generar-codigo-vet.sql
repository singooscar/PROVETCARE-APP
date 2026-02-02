-- ============================================================
-- GENERAR CÓDIGO DE INVITACIÓN PARA VETERINARIO
-- ============================================================
-- 
-- INSTRUCCIONES:
-- 1. Abre pgAdmin o psql
-- 2. Conéctate a la base de datos 'provetcare'
-- 3. Ejecuta este archivo completo
-- 4. Copia el código generado y úsalo en el registro
--
-- ============================================================
-- Generar código automático con fecha/hora
INSERT INTO invitation_codes (code, expires_at)
VALUES (
        'VET-' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24MISS'),
        NOW() + INTERVAL '30 days'
    )
RETURNING code AS "CÓDIGO GENERADO",
    expires_at AS "EXPIRA EL",
    '¡Usa este código para registrar un veterinario!' AS "NOTA";
-- Ver todos los códigos disponibles
SELECT code AS "Código",
    is_used AS "¿Usado?",
    expires_at AS "Expira",
    created_at AS "Creado"
FROM invitation_codes
WHERE is_used = FALSE
    AND expires_at > NOW()
ORDER BY created_at DESC;