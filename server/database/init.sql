-- ============================================================================
-- PROVETCARE - Script de Inicialización de Base de Datos PostgreSQL
-- Sistema de Agendamiento de Citas Veterinarias
-- ============================================================================
-- Crear base de datos (ejecutar como superuser)
DROP DATABASE IF EXISTS provetcare_db;
CREATE DATABASE provetcare_db;
-- Conectar a la base de datos
\ c provetcare_db;
-- ============================================================================
-- TABLA: users
-- ============================================================================
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
-- ============================================================================
-- TABLA: pets
-- ============================================================================
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
-- ============================================================================
-- TABLA: appointments
-- ============================================================================
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
            'cancelled'
        )
    ),
    notes TEXT,
    admin_notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================================
-- TABLA: medical_records
-- ============================================================================
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
-- ============================================================================
-- TABLA: chat_messages
-- ============================================================================
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================================
-- ÍNDICES
-- ============================================================================
-- Índices para mejorar rendimiento de búsquedas
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_appointments_pet ON appointments(pet_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_pet ON medical_records(pet_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);
-- Índice único compuesto para evitar citas duplicadas en mismo horario
CREATE UNIQUE INDEX idx_unique_appointment_slot ON appointments(appointment_date, appointment_time)
WHERE status IN ('approved', 'pending');
-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE
UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE
UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- VISTAS
-- ============================================================================
-- Vista para citas con información completa
CREATE VIEW v_appointments_full AS
SELECT a.id,
    a.appointment_date,
    a.appointment_time,
    a.service_type,
    a.status,
    a.notes,
    a.admin_notes,
    a.reminder_sent,
    a.created_at,
    p.id as pet_id,
    p.name as pet_name,
    p.species,
    p.breed,
    u.id as client_id,
    u.full_name as client_name,
    u.email as client_email,
    u.phone as client_phone
FROM appointments a
    JOIN pets p ON a.pet_id = p.id
    JOIN users u ON a.client_id = u.id;
-- ============================================================================
-- DATOS DE PRUEBA (SEED DATA)
-- ============================================================================
-- Usuario administrador
-- Password: admin123 (hasheado con bcrypt)
INSERT INTO users (email, password, full_name, phone, role)
VALUES (
        'admin@provetcare.com',
        '$2a$10$rGqN7jZYKsHqZ9QCqLvXAeJKjF8H3FH7qYGqQ1qP8yZYQ7YqZ8YqZ',
        'Dr. Carlos Administrador',
        '555-0000',
        'admin'
    );
-- Usuarios clientes de prueba
-- Password para ambos: cliente123
INSERT INTO users (email, password, full_name, phone, role)
VALUES (
        'juan.perez@email.com',
        '$2a$10$rGqN7jZYKsHqZ9QCqLvXAeJKjF8H3FH7qYGqQ1qP8yZYQ7YqZ8YqZ',
        'Juan Pérez',
        '555-1234',
        'client'
    ),
    (
        'maria.garcia@email.com',
        '$2a$10$rGqN7jZYKsHqZ9QCqLvXAeJKjF8H3FH7qYGqQ1qP8yZYQ7YqZ8YqZ',
        'María García',
        '555-5678',
        'client'
    );
-- Mascotas de prueba
INSERT INTO pets (
        owner_id,
        name,
        species,
        breed,
        age,
        weight,
        gender,
        notes
    )
VALUES (
        2,
        'Max',
        'Perro',
        'Labrador',
        5,
        30.5,
        'macho',
        'Muy activo y amigable'
    ),
    (
        2,
        'Luna',
        'Gato',
        'Siamés',
        3,
        4.2,
        'hembra',
        'Le gusta dormir mucho'
    ),
    (
        3,
        'Rocky',
        'Perro',
        'Pastor Alemán',
        7,
        35.0,
        'macho',
        'Necesita ejercicio diario'
    );
-- Citas de prueba
INSERT INTO appointments (
        pet_id,
        client_id,
        appointment_date,
        appointment_time,
        service_type,
        status,
        notes
    )
VALUES (
        1,
        2,
        CURRENT_DATE + INTERVAL '3 days',
        '10:00:00',
        'Consulta General',
        'approved',
        'Revisión de rutina'
    ),
    (
        2,
        2,
        CURRENT_DATE + INTERVAL '5 days',
        '14:30:00',
        'Vacunación',
        'pending',
        'Primera dosis'
    ),
    (
        3,
        3,
        CURRENT_DATE + INTERVAL '7 days',
        '11:00:00',
        'Control de Peso',
        'approved',
        'Seguimiento mensual'
    );
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que todo se creó correctamente
DO $$
DECLARE usuarios_count INTEGER;
mascotas_count INTEGER;
citas_count INTEGER;
BEGIN
SELECT COUNT(*) INTO usuarios_count
FROM users;
SELECT COUNT(*) INTO mascotas_count
FROM pets;
SELECT COUNT(*) INTO citas_count
FROM appointments;
RAISE NOTICE '✅ Base de datos inicializada correctamente';
RAISE NOTICE 'Usuarios creados: %',
usuarios_count;
RAISE NOTICE 'Mascotas creadas: %',
mascotas_count;
RAISE NOTICE 'Citas creadas: %',
citas_count;
END $$;
-- Mostrar resumen
SELECT (
        SELECT COUNT(*)
        FROM users
    ) as usuarios_creados,
    (
        SELECT COUNT(*)
        FROM pets
    ) as mascotas_creadas,
    (
        SELECT COUNT(*)
        FROM appointments
    ) as citas_creadas;