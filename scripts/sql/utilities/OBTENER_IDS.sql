-- Obtener IDs actuales para el Test
SELECT id as client_id,
    email
FROM users
WHERE email = 'cliente@example.com';
SELECT id as admin_id,
    email
FROM users
WHERE email = 'admin@provetcare.com';
SELECT id as pet_id,
    name
FROM pets
WHERE owner_id = (
        SELECT id
        FROM users
        WHERE email = 'cliente@example.com'
    );