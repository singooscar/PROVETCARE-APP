-- ============================================================================
-- PROVETCARE - Seed Data para Inventario de Medicamentos
-- ============================================================================
-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    unit_type VARCHAR(50) DEFAULT 'unidad',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Limpiar datos existentes (opcional)
-- DELETE FROM inventory_items;
-- Insertar medicamentos veterinarios comunes
INSERT INTO inventory_items (
        name,
        description,
        unit_price,
        stock,
        unit_type,
        active
    )
VALUES -- Antibióticos
    (
        'Amoxicilina 500mg',
        'Antibiótico de amplio espectro para infecciones bacterianas',
        15.50,
        100,
        'tableta',
        true
    ),
    (
        'Cefalexina 250mg',
        'Antibiótico para infecciones de piel y tejidos blandos',
        18.00,
        80,
        'cápsula',
        true
    ),
    (
        'Enrofloxacina 50mg',
        'Antibiótico fluoroquinolona para perros y gatos',
        22.00,
        60,
        'tableta',
        true
    ),
    (
        'Metronidazol 250mg',
        'Antibiótico para infecciones gastrointestinales',
        12.00,
        90,
        'tableta',
        true
    ),
    -- Antiparasitarios
    (
        'Ivermectina 1%',
        'Antiparasitario interno y externo',
        25.00,
        50,
        'ml',
        true
    ),
    (
        'Praziquantel 50mg',
        'Desparasitante para tenias',
        20.00,
        70,
        'tableta',
        true
    ),
    (
        'Fenbendazol 500mg',
        'Antiparasitario de amplio espectro',
        16.00,
        85,
        'tableta',
        true
    ),
    (
        'Milbemicina 5mg',
        'Prevención de parásitos cardíacos',
        28.00,
        45,
        'tableta',
        true
    ),
    -- Antiinflamatorios y Analgésicos
    (
        'Meloxicam 1.5mg',
        'Antiinflamatorio no esteroideo (AINE)',
        14.00,
        120,
        'tableta',
        true
    ),
    (
        'Carprofeno 75mg',
        'AINE para dolor y inflamación',
        19.00,
        95,
        'tableta',
        true
    ),
    (
        'Tramadol 50mg',
        'Analgésico opioide para dolor moderado a severo',
        24.00,
        60,
        'tableta',
        true
    ),
    (
        'Gabapentina 300mg',
        'Analgésico para dolor neuropático',
        21.00,
        55,
        'cápsula',
        true
    ),
    -- Corticosteroides
    (
        'Prednisona 5mg',
        'Corticosteroide para inflamación y alergias',
        10.00,
        110,
        'tableta',
        true
    ),
    (
        'Dexametasona 0.5mg',
        'Corticosteroide potente',
        13.00,
        75,
        'tableta',
        true
    ),
    -- Medicamentos Gastrointestinales
    (
        'Omeprazol 20mg',
        'Inhibidor de bomba de protones para úlceras',
        17.00,
        80,
        'cápsula',
        true
    ),
    (
        'Ranitidina 150mg',
        'Antiácido para problemas gástricos',
        11.00,
        90,
        'tableta',
        true
    ),
    (
        'Metoclopramida 10mg',
        'Antiemético y procinético',
        9.00,
        100,
        'tableta',
        true
    ),
    -- Medicamentos Cardíacos
    (
        'Enalapril 5mg',
        'Inhibidor de la ECA para insuficiencia cardíaca',
        23.00,
        65,
        'tableta',
        true
    ),
    (
        'Furosemida 40mg',
        'Diurético para insuficiencia cardíaca',
        15.00,
        85,
        'tableta',
        true
    ),
    (
        'Pimobendan 5mg',
        'Inotrópico para insuficiencia cardíaca congestiva',
        35.00,
        40,
        'tableta',
        true
    ),
    -- Suplementos y Vitaminas
    (
        'Complejo B Inyectable',
        'Vitaminas del complejo B',
        18.00,
        50,
        'ampolla',
        true
    ),
    (
        'Calcio + Vitamina D',
        'Suplemento para huesos y articulaciones',
        14.00,
        70,
        'tableta',
        true
    ),
    (
        'Omega 3 para mascotas',
        'Ácidos grasos esenciales',
        26.00,
        55,
        'cápsula',
        true
    ),
    -- Soluciones y Líquidos
    (
        'Suero Fisiológico 0.9%',
        'Solución salina para hidratación',
        8.00,
        200,
        'bolsa 500ml',
        true
    ),
    (
        'Lactato de Ringer',
        'Solución electrolítica balanceada',
        9.00,
        150,
        'bolsa 500ml',
        true
    ),
    -- Oftálmicos y Óticos
    (
        'Tobramicina Oftálmica',
        'Antibiótico para infecciones oculares',
        16.00,
        45,
        'frasco',
        true
    ),
    (
        'Gentamicina Ótica',
        'Antibiótico para infecciones de oído',
        15.00,
        50,
        'frasco',
        true
    ),
    -- Dermatológicos
    (
        'Ketoconazol Shampoo',
        'Antifúngico para dermatitis',
        20.00,
        40,
        'frasco 200ml',
        true
    ),
    (
        'Clorhexidina 2%',
        'Antiséptico para heridas',
        12.00,
        80,
        'frasco 250ml',
        true
    ),
    -- Vacunas (almacenamiento)
    (
        'Vacuna Múltiple Canina',
        'Protección contra parvovirus, moquillo, etc.',
        45.00,
        30,
        'dosis',
        true
    ),
    (
        'Vacuna Antirrábica',
        'Prevención de rabia',
        35.00,
        50,
        'dosis',
        true
    ),
    (
        'Vacuna Triple Felina',
        'Protección para gatos',
        42.00,
        25,
        'dosis',
        true
    ) ON CONFLICT DO NOTHING;
-- Crear trigger para updated_at si no existe
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_inventory_items_updated_at'
) THEN CREATE TRIGGER update_inventory_items_updated_at BEFORE
UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
-- Verificación
DO $$
DECLARE items_count INTEGER;
BEGIN
SELECT COUNT(*) INTO items_count
FROM inventory_items
WHERE active = true;
RAISE NOTICE '✅ Inventario inicializado correctamente';
RAISE NOTICE 'Medicamentos activos: %',
items_count;
END $$;
-- Mostrar resumen
SELECT COUNT(*) as total_medicamentos,
    COUNT(*) FILTER (
        WHERE active = true
    ) as medicamentos_activos,
    SUM(stock) as stock_total
FROM inventory_items;