-- ============================================================================
-- QUERY DE VERIFICACIÓN: Sistema Dual-Flow
-- Ejecutar en pgAdmin después de las pruebas
-- ============================================================================
-- 1. Ver todas las citas con identificación de flujo
SELECT id,
    status as estado,
    CASE
        WHEN created_by_admin IS NULL THEN '👤 FLUJO A (Cliente)'
        ELSE '👨‍⚕️ FLUJO B (Veterinario)'
    END as tipo_flujo,
    appointment_date as fecha,
    appointment_time as hora,
    service_type as servicio,
    admin_notes as notas,
    created_by_admin as creado_por_admin_id,
    created_at,
    updated_at
FROM appointments
ORDER BY created_at DESC
LIMIT 10;
-- 2. Resumen por tipo de flujo
SELECT CASE
        WHEN created_by_admin IS NULL THEN 'FLUJO A (Cliente)'
        ELSE 'FLUJO B (Veterinario)'
    END as tipo,
    status as estado,
    COUNT(*) as cantidad
FROM appointments
GROUP BY tipo,
    status
ORDER BY tipo,
    status;
-- 3. Ver últimas citas creadas con datos del cliente
SELECT a.id,
    a.status,
    CASE
        WHEN a.created_by_admin IS NULL THEN 'Cliente'
        ELSE u_admin.full_name
    END as creador,
    u_client.full_name as cliente,
    u_client.email,
    a.appointment_date,
    a.appointment_time,
    a.service_type,
    a.created_at
FROM appointments a
    JOIN users u_client ON a.client_id = u_client.id
    LEFT JOIN users u_admin ON a.created_by_admin = u_admin.id
ORDER BY a.created_at DESC
LIMIT 10;
-- 4. Verificar que los índices existen
SELECT indexname as indice,
    tablename as tabla,
    indexdef as definicion
FROM pg_indexes
WHERE tablename = 'appointments'
    AND indexname LIKE 'idx_appointments_%';
-- 5. Ver constraint de estados
SELECT conname as nombre_constraint,
    pg_get_constraintdef(oid) as definicion
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass
    AND contype = 'c'
    AND conname = 'appointments_status_check';