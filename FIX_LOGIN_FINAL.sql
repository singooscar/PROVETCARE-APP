-- ============================================================================
-- ARREGLO FINAL DE LOGIN
-- Hash generado automáticamente por el servidor para 'admin123'
-- ============================================================================

UPDATE users 
SET password = '$2a$12$Uu7FfLeea6JYDXV2aYQIQuopVnUKQqu6i34it4uIOiHsjpgUPC9cm'
WHERE email IN ('admin@provetcare.com', 'cliente@example.com');

SELECT '✅ Usuarios actualizados correctamente' as mensaje;
SELECT email, role, left(password, 20) || '...' as hash_inicio FROM users WHERE email IN ('admin@provetcare.com', 'cliente@example.com');
