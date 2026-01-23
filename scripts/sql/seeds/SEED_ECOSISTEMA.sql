-- ============================================================================
-- SEED DATA ECOSISTEMA: Datos iniciales de prueba
-- ============================================================================
-- 1. Insertar Servicios Base
INSERT INTO services_catalog (name, description, base_price, duration_minutes)
VALUES (
        'Consulta General',
        'Revisión física completa y diagnóstico básico',
        30.00,
        30
    ),
    (
        'Vacunación',
        'Aplicación de vacunas (Rabia, Parvovirus, etc.)',
        15.00,
        15
    ),
    (
        'Desparasitación',
        'Tratamiento interno y externo',
        10.00,
        15
    ),
    (
        'Ecografía',
        'Exámen de imagenología básico',
        45.00,
        45
    ),
    (
        'Cirugía Menor',
        'Procedimientos ambulatorios y suturas',
        80.00,
        60
    ),
    (
        'Limpieza Dental',
        'Profilaxis y destartraje',
        50.00,
        45
    );
-- 2. Insertar Inventario (Medicamentos y Productos)
INSERT INTO inventory_items (name, description, unit_price, stock, unit_type)
VALUES -- Medicamentos
    (
        'Amoxicilina 500mg',
        'Antibiótico de amplio espectro',
        5.00,
        100,
        'tableta'
    ),
    (
        'Meloxicam 2mg',
        'Antiinflamatorio no esteroideo',
        8.50,
        50,
        'frasco 10ml'
    ),
    (
        'Prednisona 20mg',
        'Corticosteroide',
        0.50,
        200,
        'tableta'
    ),
    (
        'NexGard Spectra (Pequeño)',
        'Antipulgas y garrapatas (2-3.5kg)',
        18.00,
        30,
        'tableta'
    ),
    (
        'Simparica Trio',
        'Protección integral parásitos',
        22.00,
        25,
        'tableta'
    ),
    (
        'Vacuna Antirrábica',
        'Dosis única anual',
        12.00,
        50,
        'dosis'
    ),
    -- Insumos
    (
        'Collar Isabelino',
        'Protección post-operatoria Talla M',
        15.00,
        20,
        'unidad'
    ),
    (
        'Shampoo Medicado',
        'Para problemas dérmicos (Clorhexidina)',
        25.00,
        15,
        'frasco'
    ),
    (
        'Lata Hill''s Digestive',
        'Alimento húmedo dieta blanda',
        4.50,
        40,
        'lata'
    );
-- 3. Crear facturas de prueba para citas existentes (si hay)
-- Esto es opcional, solo para tener datos si ya existen citas
INSERT INTO invoices (appointment_id, client_id, total_amount, status)
SELECT id,
    client_id,
    0.00,
    'draft'
FROM appointments
WHERE status IN ('requested', 'confirmed')
    AND NOT EXISTS (
        SELECT 1
        FROM invoices
        WHERE appointment_id = appointments.id
    );