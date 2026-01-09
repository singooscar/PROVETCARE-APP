// Node 20+ has global fetch


// If node < 18, fetch might not be global. But usually in these envs it is or we can use http.
// Let's use standard http to be safe if fetch isn't there, or just assume fetch if Node 18+
// Given previous output "Node.js v20.19.6", fetch is available globally!

const API_URL = 'http://localhost:5000/api/auth/login';

async function testLogin(email, password, label) {
    console.log(`\n🔑 Probando login para: ${label}`);
    console.log(`   Email: ${email}`);
    console.log(`   Pass:  ${password}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ LOGIN EXITOSO`);
            console.log(`   Token recibido: ${data.token ? 'Sí' : 'No'}`);
            console.log(`   Rol: ${data.user ? data.user.role : 'N/A'}`);
            return true;
        } else {
            console.log(`❌ LOGIN FALLIDO: ${response.status}`);
            console.log(`   Error: ${JSON.stringify(data)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ERROR DE CONEXIÓN: ${error.message}`);
        return false;
    }
}

async function run() {
    console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN');

    // 1. Probar Admin
    const adminSuccess = await testLogin('admin@provetcare.com', 'admin123', 'ADMINISTRADOR');

    // 2. Probar Cliente (con password admin123)
    const clientSuccess = await testLogin('cliente@example.com', 'admin123', 'CLIENTE');

    // 3. Probar Cliente (con password password123 - por si acaso)
    if (!clientSuccess) {
        await testLogin('cliente@example.com', 'password123', 'CLIENTE (intento 2)');
    }
}

run();
