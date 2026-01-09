-- ============================================================================
-- CREAR USUARIOS DE PRUEBA COMPLETOS
-- Crea admin Y cliente para las pruebas
-- ============================================================================
-- PASO 1: Eliminar usuarios anteriores si existen
DELETE FROM pets
WHERE owner_id IN (
        SELECT id
        FROM users
        WHERE email IN ('admin@provetcare.com', 'cliente@example.com')
    );
DELETE FROM users
WHERE email IN ('admin@provetcare.com', 'cliente@example.com');
-- PASO 2: Crear usuario ADMIN
-- Password hasheado para 'admin123' con bcryptjs
INSERT INTO users (
        full_name,
        email,
        phone,
        password,
        role,
        created_at
    )
VALUES (
        'Administrador PROVETCARE',
        'admin@provetcare.com',
        '555-ADMIN',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC9PgCjpq6m',
        'admin',
        CURRENT_TIMESTAMP
    );
-- PASO 3: Crear usuario CLIENTE (mismo password que admin para simplificar)
INSERT INTO users (
        full_name,
        email,
        phone,
        password,
        role,
        created_at
    )
VALUES (
        'Cliente de Prueba',
        'cliente@example.com',
        '555-0001',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC9PgCjpq6m',
        'client',
        CURRENT_TIMESTAMP
    );
-- PASO 4: Crear mascota para el cliente
INSERT INTO pets (name, species, breed, owner_id, created_at)
SELECT 'Max',
    'Perro',
    'Labrador',
    u.id,
    CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'cliente@example.com';
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT '═══════════════════════════════════════════' as separador;
SELECT '✅ USUARIOS CREADOS' as resultado;
SELECT '═══════════════════════════════════════════' as separador;
SELECT id,
    full_name as nombre,
    email,
    role as rol,
    'Password: admin123' as credencial
FROM users
WHERE email IN ('cliente@example.com', 'admin@provetcare.com')
ORDER BY CASE
        WHEN email = 'admin@provetcare.com' THEN 1
        ELSE 2
    END;
SELECT '═══════════════════════════════════════════' as separador;
SELECT '✅ MASCOTAS DEL CLIENTE' as resultado;
SELECT '═══════════════════════════════════════════' as separador;
SELECT p.id as pet_id,
    p.name as mascota,
    p.species as especie,
    p.breed as raza,
    u.full_name as dueño,
    u.email
FROM pets p
    JOIN users u ON p.owner_id = u.id
WHERE u.email = 'cliente@example.com';
SELECT '═══════════════════════════════════════════' as separador;
SELECT '📊 IDs PARA REFERENCIA' as info;
SELECT '═══════════════════════════════════════════' as separador;
SELECT (
        SELECT id
        FROM users
        WHERE email = 'admin@provetcare.com'
    ) as admin_id,
    (
        SELECT id
        FROM users
        WHERE email = 'cliente@example.com'
    ) as client_id,
    (
        SELECT id
        FROM pets
        WHERE owner_id = (
                SELECT id
                FROM users
                WHERE email = 'cliente@example.com'
            )
        LIMIT 1
    ) as pet_id;
SELECT '═══════════════════════════════════════════' as separador;
SELECT '✅ SETUP COMPLETADO EXITOSAMENTE' as resultado;
SELECT '═══════════════════════════════════════════' as separador;
SELECT '' as espacio;
SELECT '📋 CREDENCIALES (ambos usan el mismo password):' as info;
SELECT '   👨‍⚕️ Admin: admin@provetcare.com / admin123' as credencial_admin;
SELECT '   👤 Cliente: cliente@example.com / admin123' as credencial_cliente;
SELECT '' as espacio;
SELECT '🐾 Mascota creada: Max (Perro Labrador)' as mascota;
SELECT '' as espacio;
SELECT '▶️  EJECUTA: node test-dual-flow-appointments.js' as siguiente_paso;