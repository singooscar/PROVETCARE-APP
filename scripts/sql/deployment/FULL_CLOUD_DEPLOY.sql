-- ============================================================================
-- PROVETCARE - SCRIPT DE DESPLIEGUE COMPLETO EN LA NUBE ☁️
-- Ejecuta este script SÓLO UNA VEZ en el editor SQL de Supabase/Neon
-- ============================================================================
-- 1. LIMPIEZA INICIAL (Por seguridad, borramos tablas si existen para reiniciar limpio)
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS services_catalog CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- 2. BASE DE DATOS PRINCIPAL (Users, Pets, Appointments)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER CHECK (age >= 0),
    weight DECIMAL(10, 2) CHECK (weight > 0),
    gender VARCHAR(10) CHECK (gender IN ('macho', 'hembra')),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected',
            'completed',
            'cancelled',
            'requested',
            'confirmed',
            'under_review'
        )
    ),
    notes TEXT,
    admin_notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE
    SET NULL,
        visit_date DATE NOT NULL,
        diagnosis TEXT,
        treatment TEXT,
        medications TEXT,
        weight DECIMAL(10, 2),
        temperature DECIMAL(5, 2),
        notes TEXT,
        veterinarian_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. ECOSISTEMA (Facturación, Farmacia, Recetas)
CREATE TABLE services_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    unit_type VARCHAR(50) DEFAULT 'unidad',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    client_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    item_id INTEGER,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    stripe_payment_intent_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    pet_id INTEGER REFERENCES pets(id),
    vet_id INTEGER REFERENCES users(id),
    instructions TEXT,
    notes TEXT,
    pdf_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE prescription_items (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
    inventory_item_id INTEGER REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    dosage VARCHAR(255),
    duration VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. DATOS INICIALES (SEED DATA)
-- Usuario Admin (Password: admin123)
INSERT INTO users (full_name, email, phone, password, role)
VALUES (
        'Administrador PROVETCARE',
        'admin@provetcare.com',
        '555-ADMIN',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC9PgCjpq6m',
        'admin'
    );
-- Usuario Cliente (Password: admin123)
INSERT INTO users (full_name, email, phone, password, role)
VALUES (
        'Cliente de Prueba',
        'cliente@example.com',
        '555-0001',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC9PgCjpq6m',
        'client'
    );
-- Mascota
INSERT INTO pets (name, species, breed, owner_id)
SELECT 'Max',
    'Perro',
    'Labrador',
    id
FROM users
WHERE email = 'cliente@example.com';
-- Inventario Inicial
INSERT INTO inventory_items (name, description, unit_price, stock, unit_type)
VALUES (
        'Amoxicilina 500mg',
        'Antibiótico de amplio espectro',
        15.50,
        100,
        'caja'
    ),
    (
        'Vacuna Rabia',
        'Vacuna anual obligatoria',
        25.00,
        50,
        'dosis'
    ),
    (
        'Meloxicam 2mg',
        'Antiinflamatorio no esteroideo',
        12.75,
        80,
        'frasco'
    ),
    (
        'Pipeta Antipulgas',
        'Protección mensual',
        18.00,
        200,
        'unidad'
    ),
    (
        'Champú Medicado',
        'Para dermatitis',
        22.00,
        30,
        'botella'
    );
-- Catálogo de Servicios
INSERT INTO services_catalog (name, description, base_price, duration_minutes)
VALUES (
        'Consulta General',
        'Revisión física completa',
        30.00,
        30
    ),
    (
        'Vacunación',
        'Aplicación de vacunas y registro',
        15.00,
        15
    ),
    (
        'Cirugía Menor',
        'Procedimientos ambulatorios',
        150.00,
        90
    ),
    (
        'Limpieza Dental',
        'Profilaxis completa con anestesia',
        80.00,
        60
    ),
    (
        'Exámenes de Laboratorio',
        'Hemograma y bioquímica',
        45.00,
        20
    );
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE
UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();