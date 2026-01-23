-- ============================================================================
-- PROVETCARE - Módulo de Facturación
-- ============================================================================
-- 1. Tabla de Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    client_id INTEGER REFERENCES users(id),
    pet_id INTEGER REFERENCES pets(id),
    vet_id INTEGER REFERENCES users(id),
    invoice_number VARCHAR(20) UNIQUE,
    -- Ej: FAC-0001
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    -- Impuestos si aplican
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'issued',
    -- issued, paid, cancelled
    pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Detalles de la Factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);
-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
-- 4. Secuencia para número de factura (opcional, para lógica de aplicación)
-- Se manejará en el backend generando FAC-XXXX