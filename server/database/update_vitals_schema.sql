-- PROVETCARE - Actualización de Esquema para Consulta Médica Integral
-- 1. Agregar columnas de signos vitales a medical_records
ALTER TABLE medical_records
ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
    -- Latidos por minuto
ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER,
    -- Respiraciones por minuto
ADD COLUMN IF NOT EXISTS mucous_membranes VARCHAR(50),
    -- Estado de mucosas (rosadas, pálidas, etc.)
ADD COLUMN IF NOT EXISTS capillary_refill_time VARCHAR(50),
    -- Tiempo de llenado capilar (<2s, etc.)
ADD COLUMN IF NOT EXISTS hydration_status VARCHAR(50),
    -- Estado de hidratación
ADD COLUMN IF NOT EXISTS body_condition_score VARCHAR(50),
    -- Condición corporal (1-5 o 1-9)
ADD COLUMN IF NOT EXISTS abdomen_palpation TEXT,
    -- Hallazgos palpación abdominal
ADD COLUMN IF NOT EXISTS lymph_nodes TEXT;
-- Estado ganglios linfáticos
-- 2. Asegurar que existan las columnas básicas (por si acaso)
-- weight y temperature ya deberían existir según el schema original, pero nos aseguramos
DO $$ BEGIN -- Verificar weight
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'medical_records'
        AND column_name = 'weight'
) THEN
ALTER TABLE medical_records
ADD COLUMN weight DECIMAL(5, 2);
END IF;
-- Verificar temperature
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'medical_records'
        AND column_name = 'temperature'
) THEN
ALTER TABLE medical_records
ADD COLUMN temperature DECIMAL(4, 1);
END IF;
END $$;