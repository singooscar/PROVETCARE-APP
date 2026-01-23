-- Script para actualizar el email del usuario de prueba
-- Cambia juan.perez@email.com por oscarsingo2004@gmail.com
UPDATE users
SET email = 'oscarsingo2004@gmail.com'
WHERE email = 'juan.perez@email.com';
-- Verificar el cambio
SELECT id,
    full_name,
    email,
    role
FROM users
WHERE email = 'oscarsingo2004@gmail.com';