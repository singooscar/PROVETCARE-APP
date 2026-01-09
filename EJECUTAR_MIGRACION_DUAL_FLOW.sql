-- ============================================================================
-- SCRIPT DE MIGRACIÓN: Sistema Dual-Flow de Citas
-- Para ejecutar directamente en pgAdmin
-- ============================================================================
-- 1. Eliminar constraint anterior de estados
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
-- 2. Agregar nuevo constraint con estados expandidos
ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check CHECK (
        status IN (
            'requested',
            -- Cliente solicita cita (nuevo)
            'under_review',
            -- Veterinario revisa solicitud (nuevo)
            'confirmed',
            -- Cita confirmada (nuevo nombre estándar)
            'approved',
            -- Alias legacy (mantener compatibilidad)
            'rejected',
            -- Rechazada por veterinario
            'completed',
            -- Cita realizada
            'cancelled',
            -- Cancelada por cliente/admin
            'pending' -- Deprecado (legacy support)
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
-- ============================================================================
-- VERIFICACIÓN DE MIGRACIÓN
-- ============================================================================
-- Ver constraint actual
SELECT 'CHECK CONSTRAINT' as tipo,
    conname as nombre,
    pg_get_constraintdef(oid) as definicion
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass
    AND contype = 'c'
    AND conname = 'appointments_status_check';
-- Ver nueva columna
SELECT 'NUEVA COLUMNA' as tipo,
    column_name as nombre,
    data_type as tipo_dato,
    is_nullable as permite_null
FROM information_schema.columns
WHERE table_name = 'appointments'
    AND column_name = 'created_by_admin';
-- Ver índices creados
SELECT 'ÍNDICES' as tipo,
    indexname as nombre,
    indexdef as definicion
FROM pg_indexes
WHERE tablename = 'appointments'
    AND indexname LIKE 'idx_appointments_%';
-- Resumen de estados actuales
SELECT '📊 RESUMEN DE CITAS' as reporte,
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
            WHEN status = 'under_review' THEN 1
        END
    ) as en_revision,
    COUNT(
        CASE
            WHEN created_by_admin IS NOT NULL THEN 1
        END
    ) as creadas_por_vet
FROM appointments;
-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Constraint actualizado con nuevos estados
-- ✅ Columna created_by_admin agregada  
-- ✅ 3 índices creados para optimización
-- ✅ Datos existentes migrados a nuevos estados
-- ============================================================================
SELECT '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado;