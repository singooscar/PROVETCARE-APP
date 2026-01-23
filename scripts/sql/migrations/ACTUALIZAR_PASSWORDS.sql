-- ============================================================================
-- ACTUALIZAR PASSWORDS DE USUARIOS CON HASH VÁLIDO
-- Password para ambos: admin123
-- Hash generado con bcryptjs cost 12
-- ============================================================================

-- Actualizar passwords de admin y cliente con el mismo hash válido
UPDATE users 
SET password = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email IN ('admin@provetcare.com', 'cliente@example.com');

-- Verificar
SELECT 
    '✅ PASSWORDS ACTUALIZADOS' as resultado,
    email,
    LEFT(password, 30) || '...' as hash_preview,
    'Password: admin123' as credencial
FROM users
WHERE email IN ('admin@provetcare.com', 'cliente@example.com')
ORDER BY email;

SELECT '▶️  Ejecuta: node test-dual-flow-appointments.js' as siguiente_paso;
