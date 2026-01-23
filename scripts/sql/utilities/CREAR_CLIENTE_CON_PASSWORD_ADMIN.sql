-- ============================================================================
-- CREAR CLIENTE DE PRUEBA (CORREGIDO)
-- Usa el mismo hash de password que admin
-- ============================================================================
-- PASO 1: Verificar que admin existe
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'admin@provetcare.com'
) THEN RAISE EXCEPTION 'Usuario admin no existe. Créalo primero.';
END IF;
END $$;
-- PASO 2: Eliminar datos anteriores del cliente de prueba
DELETE FROM pets
WHERE owner_id IN (
        SELECT id
        FROM users
        WHERE email = 'cliente@example.com'
    );
DELETE FROM users
WHERE email = 'cliente@example.com';
-- PASO 3: Crear usuario cliente con el mismo hash que admin
INSERT INTO users (
        full_name,
        email,
        phone,
        password,
        role,
        created_at
    )
SELECT 'Cliente de Prueba',
    'cliente@example.com',
    '555-0001',
    u.password,
    -- Copiar el hash de password del admin
    'client',
    CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'admin@provetcare.com';
-- PASO 4: Verificar que el cliente fue creado
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'cliente@example.com'
) THEN RAISE EXCEPTION 'No se pudo crear el usuario cliente';
END IF;
END $$;
-- PASO 5: Crear mascota para el cliente
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
    CASE
        WHEN email = 'admin@provetcare.com' THEN 'Password: admin123'
        WHEN email = 'cliente@example.com' THEN 'Password: admin123 (mismo que admin)'
    END as credenciales
FROM users
WHERE email IN ('cliente@example.com', 'admin@provetcare.com')
ORDER BY email;
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
SELECT '📊 IDs PARA COPIAR AL TEST' as info;
SELECT '═══════════════════════════════════════════' as separador;
SELECT (
        SELECT id
        FROM users
        WHERE email = 'cliente@example.com'
    ) as client_id,
    (
        SELECT id
        FROM users
        WHERE email = 'admin@provetcare.com'
    ) as admin_id,
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
SELECT '✅ SETUP COMPLETADO' as resultado;
SELECT '═══════════════════════════════════════════' as separador;
SELECT '' as espacio;
SELECT '� CREDENCIALES:' as info;
SELECT '   Cliente: cliente@example.com / admin123' as credencial_cliente;
SELECT '   Admin: admin@provetcare.com / admin123' as credencial_admin;
SELECT '' as espacio;
SELECT '▶️  EJECUTA: node test-dual-flow-appointments.js' as siguiente_paso;