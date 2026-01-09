-- ============================================================================
-- MIGRACIÓN DE ECOSISTEMA: Facturación, Farmacia, Recetas y Pagos
-- ============================================================================
-- 1. CATÁLOGO DE SERVICIOS
-- Tabla base para servicios clínicos (Consultas, Cirugías, etc.)
CREATE TABLE IF NOT EXISTS services_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. INVENTARIO FARMACIA Y PRODUCTOS
-- Tabla para medicamentos, alimentos, accesorios
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    unit_type VARCHAR(50) DEFAULT 'unidad',
    -- tableta, ml, caja, etc.
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. FACTURAS (INVOICES)
-- Centraliza todo el cobro. Se vincula a una cita y un cliente.
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    client_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    -- balance_due se calcula por aplicación, pero mantenemos columna para búsquedas rápidas
    balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(20) DEFAULT 'draft',
    -- draft, pending, paid, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. ÍTEMS DE FACTURA (INVOICE ITEMS)
-- Detalle línea por línea de la factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    -- 'service', 'product', 'pharmacy'
    item_id INTEGER,
    -- ID de services_catalog o inventory_items
    description VARCHAR(255) NOT NULL,
    -- Nombre snapshot (por si cambia el catálogo)
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    -- Precio snapshot
    line_total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 5. PAGOS (PAYMENTS)
-- Registro de transacciones (Stripe, Efectivo, Terminal)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    -- 'stripe', 'cash', 'pos_terminal'
    stripe_payment_intent_id VARCHAR(100),
    -- ID de transacción de Stripe
    status VARCHAR(20) DEFAULT 'completed',
    -- pending, completed, failed
    recorded_by INTEGER REFERENCES users(id),
    -- Usuario (Vet/Admin) que registró el pago
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 6. RECETAS MÉDICAS (PRESCRIPTIONS)
-- Documento médico legal
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    pet_id INTEGER REFERENCES pets(id),
    vet_id INTEGER REFERENCES users(id),
    instructions TEXT,
    -- Indicaciones generales
    notes TEXT,
    -- Notas internas
    pdf_url VARCHAR(255),
    -- Link al PDF generado
    status VARCHAR(20) DEFAULT 'draft',
    -- draft, issued
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 7. DETALLE DE RECETA (PRESCRIPTION ITEMS)
-- Medicamentos específicos recetados
CREATE TABLE IF NOT EXISTS prescription_items (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
    inventory_item_id INTEGER REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    -- Cantidad a despachar (impacta facturación)
    dosage VARCHAR(255),
    -- "1 cada 8 horas"
    duration VARCHAR(100),
    -- "por 5 días"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ÍNDICES PARA RENDIMIENTO
CREATE INDEX idx_invoice_appointment ON invoices(appointment_id);
CREATE INDEX idx_invoice_client ON invoices(client_id);
CREATE INDEX idx_prescription_appointment ON prescriptions(appointment_id);
CREATE INDEX idx_inventory_name ON inventory_items(name);