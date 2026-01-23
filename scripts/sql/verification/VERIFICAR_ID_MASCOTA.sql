-- Verificar ID de la mascota del cliente
SELECT u.email as dueño,
    p.id as pet_id,
    p.name as mascota
FROM pets p
    JOIN users u ON p.owner_id = u.id
WHERE u.email = 'cliente@example.com';