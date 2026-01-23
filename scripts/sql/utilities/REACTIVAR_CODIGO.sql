-- Reactivar el código VET2026 para que pueda ser usado de nuevo
UPDATE invitation_codes
SET is_used = FALSE,
    used_by = NULL,
    used_at = NULL
WHERE code = 'VET2026';
-- Verificar el estado actual
SELECT *
FROM invitation_codes
WHERE code = 'VET2026';