-- ============================================================================
-- PROVETCARE - Vista Completa de Citas con Historial Médico y Prescripciones
-- ============================================================================
-- Esta vista optimiza las consultas al pre-agregar toda la información
-- relacionada con una cita: cliente, mascota, historiales, recetas y medicinas.
-- Eliminar vista existente si existe
DROP VIEW IF EXISTS v_appointments_complete CASCADE;
-- Crear vista completa
CREATE OR REPLACE VIEW v_appointments_complete AS
SELECT -- ========================================================================
    -- DATOS DE LA CITA
    -- ========================================================================
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.service_type,
    a.status,
    a.notes,
    a.admin_notes,
    a.reminder_sent,
    a.created_at,
    a.updated_at,
    -- ========================================================================
    -- DATOS DEL CLIENTE (DUEÑO)
    -- ========================================================================
    a.client_id,
    u.full_name as client_name,
    u.email as client_email,
    u.phone as client_phone,
    -- ========================================================================
    -- DATOS DE LA MASCOTA
    -- ========================================================================
    a.pet_id,
    p.name as pet_name,
    p.species,
    p.breed,
    p.age,
    p.weight as pet_weight,
    p.gender,
    p.photo_url as pet_photo,
    -- ========================================================================
    -- CONTADORES RÁPIDOS
    -- ========================================================================
    COUNT(DISTINCT mr.id) as medical_records_count,
    COUNT(DISTINCT pr.id) as prescriptions_count,
    -- ========================================================================
    -- HISTORIAL MÉDICO (AGREGADO COMO JSON)
    -- ========================================================================
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id',
                mr.id,
                'visit_date',
                mr.visit_date,
                'diagnosis',
                mr.diagnosis,
                'treatment',
                mr.treatment,
                'medications',
                mr.medications,
                'weight',
                mr.weight,
                'temperature',
                mr.temperature,
                'notes',
                mr.notes,
                'veterinarian_name',
                mr.veterinarian_name,
                'created_at',
                mr.created_at
            )
        ) FILTER (
            WHERE mr.id IS NOT NULL
        ),
        '[]'::json
    ) as medical_records,
    -- ========================================================================
    -- PRESCRIPCIONES CON MEDICINAS (AGREGADO COMO JSON)
    -- ========================================================================
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id',
                pr.id,
                'instructions',
                pr.instructions,
                'pdf_url',
                pr.pdf_url,
                'status',
                pr.status,
                'created_at',
                pr.created_at,
                'vet_name',
                vet.full_name,
                -- Medicinas dentro de cada prescripción
                'medications',
                (
                    SELECT json_agg(
                            jsonb_build_object(
                                'id',
                                pi.id,
                                'medication_name',
                                pi.medication_name,
                                'dosage',
                                pi.dosage,
                                'duration',
                                pi.duration,
                                'quantity',
                                pi.quantity
                            )
                        )
                    FROM prescription_items pi
                    WHERE pi.prescription_id = pr.id
                )
            )
        ) FILTER (
            WHERE pr.id IS NOT NULL
        ),
        '[]'::json
    ) as prescriptions
FROM appointments a -- JOIN con cliente
    JOIN users u ON a.client_id = u.id -- JOIN con mascota
    JOIN pets p ON a.pet_id = p.id -- LEFT JOIN con historial médico (puede no tener)
    LEFT JOIN medical_records mr ON a.id = mr.appointment_id -- LEFT JOIN con prescripciones (puede no tener)
    LEFT JOIN prescriptions pr ON mr.prescription_id = pr.id
    OR pr.appointment_id = a.id -- LEFT JOIN con veterinario de la prescripción
    LEFT JOIN users vet ON pr.vet_id = vet.id -- Agrupar por cita completa
GROUP BY a.id,
    a.appointment_date,
    a.appointment_time,
    a.service_type,
    a.status,
    a.notes,
    a.admin_notes,
    a.reminder_sent,
    a.created_at,
    a.updated_at,
    a.client_id,
    u.full_name,
    u.email,
    u.phone,
    a.pet_id,
    p.name,
    p.species,
    p.breed,
    p.age,
    p.weight,
    p.gender,
    p.photo_url;
-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================
COMMENT ON VIEW v_appointments_complete IS 'Vista optimizada con información completa de citas incluyendo cliente, mascota, 
historiales médicos y prescripciones con sus medicinas. Útil para endpoints que 
requieren datos completos sin múltiples consultas.';
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
DO $$
DECLARE view_count INTEGER;
BEGIN
SELECT COUNT(*) INTO view_count
FROM information_schema.views
WHERE table_name = 'v_appointments_complete';
IF view_count > 0 THEN RAISE NOTICE '✅ Vista v_appointments_complete creada exitosamente';
-- Mostrar ejemplo de una cita
RAISE NOTICE '📋 Ejemplo de datos:';
PERFORM *
FROM v_appointments_complete
LIMIT 1;
ELSE RAISE EXCEPTION '❌ Error al crear la vista';
END IF;
END $$;
-- Mostrar estadísticas
SELECT 'v_appointments_complete' as vista,
    COUNT(*) as total_citas,
    SUM(medical_records_count) as total_historiales,
    SUM(prescriptions_count) as total_recetas
FROM v_appointments_complete;