-- ============================================================================
-- PROVETCARE - Actualización de Esquema - Sistema de Historial Médico
-- ============================================================================
-- 1. Crear tabla de prescriptions (recetas)
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE
    SET NULL,
        pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        vet_id INTEGER NOT NULL REFERENCES users(id),
        instructions TEXT,
        pdf_url TEXT,
        status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Crear tabla de prescription_items (detalles de medicamentos)
CREATE TABLE IF NOT EXISTS prescription_items (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    inventory_item_id INTEGER,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    duration VARCHAR(100),
    quantity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Actualizar medical_records para vincular con prescriptions
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'medical_records'
        AND column_name = 'prescription_id'
) THEN
ALTER TABLE medical_records
ADD COLUMN prescription_id INTEGER REFERENCES prescriptions(id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'medical_records'
        AND column_name = 'vet_id'
) THEN
ALTER TABLE medical_records
ADD COLUMN vet_id INTEGER REFERENCES users(id);
END IF;
END $$;
-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet ON prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_vet ON prescriptions(vet_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_prescription ON medical_records(prescription_id);
-- 5. Trigger para updated_at en prescriptions
CREATE TRIGGER update_prescriptions_updated_at BEFORE
UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 6. Vista para historial médico completo
CREATE OR REPLACE VIEW v_medical_history_full AS
SELECT mr.id,
    mr.pet_id,
    mr.visit_date,
    mr.diagnosis,
    mr.treatment,
    mr.medications,
    mr.weight,
    mr.temperature,
    mr.notes,
    mr.veterinarian_name,
    mr.prescription_id,
    mr.created_at,
    p.name AS pet_name,
    p.species,
    p.breed,
    u.id AS owner_id,
    u.full_name AS owner_name,
    u.email AS owner_email,
    pr.pdf_url AS prescription_pdf,
    pr.instructions AS prescription_instructions,
    v.full_name AS vet_name
FROM medical_records mr
    JOIN pets p ON mr.pet_id = p.id
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN prescriptions pr ON mr.prescription_id = pr.id
    LEFT JOIN users v ON mr.vet_id = v.id;
COMMENT ON TABLE prescriptions IS 'Recetas médicas generadas por veterinarios';
COMMENT ON TABLE prescription_items IS 'Detalles de medicamentos en cada receta';
COMMENT ON VIEW v_medical_history_full IS 'Vista completa del historial médico con información de mascotas, dueños y recetas';
-- Verificación
DO $$
DECLARE prescriptions_count INTEGER;
medical_records_count INTEGER;
BEGIN
SELECT COUNT(*) INTO prescriptions_count
FROM prescriptions;
SELECT COUNT(*) INTO medical_records_count
FROM medical_records;
RAISE NOTICE '✅ Esquema actualizado correctamente';
RAISE NOTICE 'Recetas existentes: %',
prescriptions_count;
RAISE NOTICE 'Registros médicos existentes: %',
medical_records_count;
END $$;