-- ============================================================================
-- PROVETCARE - Módulo de Caja y Cuentas por Cobrar
-- ============================================================================
-- 0. Limpieza (Solo para asegurar esquema nuevo, ya que migramos desde appointments/invoices)
DROP TABLE IF EXISTS payment_charges CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS charges CASCADE;
-- 1. Tabla de Cargos (Deudas)
CREATE TABLE IF NOT EXISTS charges (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id),
    pet_id INTEGER REFERENCES pets(id),
    -- Opcional, puede ser un cargo general
    appointment_id INTEGER REFERENCES appointments(id),
    -- Opcional, para vincular con citas
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'VOID')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    -- 'cash', 'card', 'transfer', etc.
    reference VARCHAR(100),
    -- Nro de operación, voucher, etc.
    receipt_url TEXT,
    -- URL del PDF generado
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Tabla Relacional Pago-Cargos (Para saber qué deudas cubrió un pago)
CREATE TABLE IF NOT EXISTS payment_charges (
    payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
    charge_id INTEGER REFERENCES charges(id) ON DELETE CASCADE,
    amount_applied DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (payment_id, charge_id)
);
-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_charges_client ON charges(client_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
-- ============================================================================
-- MIGRACIÓN DE DATOS HISTÓRICOS
-- ============================================================================
-- A. Convertir citas "CONFIRMED" o "COMPLETED" en Cargos PAGADOS
INSERT INTO charges (
        client_id,
        pet_id,
        appointment_id,
        description,
        total_amount,
        paid_amount,
        status,
        created_at
    )
SELECT p.owner_id,
    a.pet_id,
    a.id,
    'Consulta Histórica (Migración)',
    0,
    -- Monto 0 para no generar deuda retroactiva desconocida
    0,
    'PAID',
    a.appointment_date
FROM appointments a
    JOIN pets p ON a.pet_id = p.id
WHERE a.status IN ('confirmed', 'completed')
    AND NOT EXISTS (
        SELECT 1
        FROM charges
        WHERE appointment_id = a.id
    );
-- B. Si existieran facturas previas en la tabla 'invoices' que creamos antes, 
-- deberíamos convertirlas a cargos.
INSERT INTO charges (
        client_id,
        pet_id,
        description,
        total_amount,
        paid_amount,
        status,
        created_at
    )
SELECT client_id,
    pet_id,
    'Factura #' || invoice_number,
    total,
    total,
    -- Asumimos que si se generó factura, ya se pagó (modelo anterior simple)
    'PAID',
    created_at
FROM invoices
WHERE EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'invoices'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM charges
        WHERE description LIKE 'Factura #' || invoice_number
    );