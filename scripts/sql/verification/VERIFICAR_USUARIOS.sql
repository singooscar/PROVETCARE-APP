-- Verificar que los usuarios existan y tengan el password correcto
SELECT 'USUARIOS EXISTENTES' as info,
    id,
    full_name,
    email,
    role,
    LEFT(password, 30) || '...' as password_hash
FROM users
WHERE email IN ('admin@provetcare.com', 'cliente@example.com')
ORDER BY email;
-- Verificar la mascota
SELECT 'MASCOTA DEL CLIENTE' as info,
    p.id,
    p.name,
    u.email as dueño,
    p.owner_id
FROM pets p
    JOIN users u ON p.owner_id = u.id
WHERE u.email = 'cliente@example.com';