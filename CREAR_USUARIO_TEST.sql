-- ============================================================================
-- CREAR USUARIO CLIENTE CON PASSWORD CORRECTO
-- Password: password123 hasheado con bcryptjs (lo que usa tu app)
-- ============================================================================
-- 1. Eliminar usuario anterior si existe
DELETE FROM pets
WHERE owner_id = (
        SELECT id
        FROM users
        WHERE email = 'cliente@example.com'
    );
DELETE FROM users
WHERE email = 'cliente@example.com';
-- 2. Crear usuario con password hasheado correctamente
-- Este hash es para 'password123' con bcryptjs cost 12
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
        '$2a$12$LqStVrKdAsR8YmKdA7FJEuO1zWqHE6Hs3cFz/JvX0YQxQkW8d.C6K',
        'client',
        CURRENT_TIMESTAMP
    );
-- 3. Crear mascota para el cliente
INSERT INTO pets (name, species, breed, owner_id, created_at)
VALUES (
        'Max',
        'Perro',
        'Labrador',
        (
            SELECT id
            FROM users
            WHERE email = 'cliente@example.com'
        ),
        CURRENT_TIMESTAMP
    );
-- 4. Verificación
SELECT '✅ USUARIO CREADO' as resultado,
    id,
    full_name,
    email,
    role
FROM users
WHERE email = 'cliente@example.com';
SELECT '✅ MASCOTA CREADA' as resultado,
    p.id,
    p.name,
    p.species,
    u.email as dueño
FROM pets p
    JOIN users u ON p.owner_id = u.id
WHERE u.email = 'cliente@example.com';
-- 5. Obtener IDs para el test
SELECT '📋 IDs PARA TEST' as info,
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
    ) as pet_id;
SELECT '✅ LISTO - Ejecuta: node test-dual-flow-appointments.js' as siguiente_paso;