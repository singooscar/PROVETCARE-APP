-- ============================================================================
-- SETUP: Crear Usuarios de Prueba para Sistema Dual-Flow (CORREGIDO)
-- Ejecutar en pgAdmin antes de las pruebas automatizadas
-- ============================================================================
-- 1. Verificar si ya existen los usuarios
SELECT 'Usuarios existentes:' as info;
SELECT id,
    full_name,
    email,
    role
FROM users
WHERE email IN ('cliente@example.com', 'admin@provetcare.com');
-- 2. Crear usuario CLIENTE de prueba (si no existe)
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
    -- Password hasheado para 'password123' (bcrypt cost 12)
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC9PgCjpq6m',
    'client',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM users
        WHERE email = 'cliente@example.com'
    );
-- 3. Verificar usuario admin existe (debería existir ya)
SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM users
            WHERE email = 'admin@provetcare.com'
                AND role = 'admin'
        ) THEN '✅ Usuario admin existe'
        ELSE '⚠️ Usuario admin NO existe - créalo manualmente'
    END as status;
-- 4. Crear una mascota de prueba para el cliente (si no existe)
-- NOTA: Ajustar columnas según tu esquema real de la tabla pets
INSERT INTO pets (name, species, breed, owner_id, created_at)
SELECT 'Max',
    'Perro',
    'Labrador',
    (
        SELECT id
        FROM users
        WHERE email = 'cliente@example.com'
    ),
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM pets
        WHERE owner_id = (
                SELECT id
                FROM users
                WHERE email = 'cliente@example.com'
            )
    )
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE email = 'cliente@example.com'
    );
-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT '==== VERIFICACIÓN DE SETUP ====' as verificacion;
-- Usuarios creados
SELECT 'USUARIOS' as tipo,
    id,
    full_name as nombre,
    email,
    role as rol
FROM users
WHERE email IN ('cliente@example.com', 'admin@provetcare.com')
ORDER BY email;
-- Mascotas del cliente
SELECT 'MASCOTAS DEL CLIENTE' as tipo,
    p.id,
    p.name as nombre,
    p.species as especie,
    u.email as dueño
FROM pets p
    JOIN users u ON p.owner_id = u.id
WHERE u.email = 'cliente@example.com';
-- Resumen
SELECT '📊 RESUMEN' as info,
    (
        SELECT COUNT(*)
        FROM users
        WHERE email = 'cliente@example.com'
    ) as cliente_existe,
    (
        SELECT COUNT(*)
        FROM users
        WHERE email = 'admin@provetcare.com'
            AND role = 'admin'
    ) as admin_existe,
    (
        SELECT COUNT(*)
        FROM pets
        WHERE owner_id = (
                SELECT id
                FROM users
                WHERE email = 'cliente@example.com'
            )
    ) as mascotas_cliente;
-- Obtener IDs para el test
SELECT '📋 DATOS PARA TEST' as info,
    (
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
-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Cliente: cliente@example.com / password123
-- ✅ Admin: admin@provetcare.com / admin123
-- ✅ Mascota: Max (Perro) del cliente
-- ============================================================================
SELECT '✅ SETUP COMPLETADO - Ejecuta: node test-dual-flow-appointments.js' as siguiente_paso;