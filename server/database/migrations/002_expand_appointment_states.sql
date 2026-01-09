-- ============================================================================
-- MIGRACIÓN: Expansión de Estados de Citas para Sistema Dual-Flow
-- Fecha: 2026-01-08
-- Descripción: Agrega estados para manejar flujos de Cliente y Veterinario
-- ============================================================================
-- 1. Eliminar constraint anterior de estados
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
-- 2. Agregar nuevo constraint con estados expandidos
ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check CHECK (
        status IN (
            -- Nuevos estados para flujo de cliente
            'requested',
            -- Cliente solicita cita (estado inicial cliente)
            'under_review',
            -- Veterinario revisa solicitud
            -- Estados confirmados
            'confirmed',
            -- Cita confirmada (nuevo nombre estándar)
            'approved',
            -- Alias legacy (mantener compatibilidad)
            -- Estados finales/compartidos
            'rejected',
            -- Rechazada por veterinario
            'completed',
            -- Cita realizada
            'cancelled',
            -- Cancelada por cliente/admin
            -- Deprecated (legacy support)
            'pending' -- Deprecado en favor de 'requested'
        )
    );
-- 3. Migrar datos existentes (normalizar estados)
UPDATE appointments
SET status = 'confirmed'
WHERE status = 'approved';
UPDATE appointments
SET status = 'requested'
WHERE status = 'pending';
-- 4. Agregar campo para identificar citas creadas por veterinarios
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS created_by_admin INTEGER REFERENCES users(id) ON DELETE
SET NULL;
-- Comentario explicativo
COMMENT ON COLUMN appointments.created_by_admin IS 'ID del veterinario que creó la cita (follow-up). NULL = creada por cliente (request).';
-- 5. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by_admin ON appointments(created_by_admin)
WHERE created_by_admin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
-- 6. Verificación de migración
SELECT '✅ MIGRACIÓN COMPLETADA' as resultado,
    COUNT(*) as total_citas,
    COUNT(
        CASE
            WHEN status = 'confirmed' THEN 1
        END
    ) as confirmadas,
    COUNT(
        CASE
            WHEN status = 'requested' THEN 1
        END
    ) as solicitadas,
    COUNT(
        CASE
            WHEN created_by_admin IS NOT NULL THEN 1
        END
    ) as creadas_por_vet
FROM appointments;
-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
-- 
-- FLUJO A - Cliente Solicita:
--   requested → under_review → confirmed/rejected
--
-- FLUJO B - Veterinario Crea Control:
--   confirmed (directo, created_by_admin NOT NULL)
--
-- Estados Finales: rejected, completed, cancelled
-- ============================================================================