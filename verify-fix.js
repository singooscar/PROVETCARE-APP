const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        let data = {};
        try {
            data = await response.json();
        } catch (e) { }
        return { status: response.status, data };
    } catch (error) {
        return { status: 500, error: error.message };
    }
}

async function run() {
    console.log('🔍 PROBANDO SOLICITUD DE CITA (FIX VERIFICATION)');

    // 1. Login
    console.log('\n1. Login Cliente...');
    const loginRes = await request('/auth/login', 'POST', {
        email: 'cliente@example.com',
        password: 'admin123'
    });

    if (loginRes.status !== 200) {
        console.log('❌ Login falló', loginRes.data);
        return;
    }

    const token = loginRes.data.token;
    const clientId = loginRes.data.user.id;
    console.log('✅ Login OK. Token recibido.');

    // 2. Request Appointment
    console.log('\n2. Solicitando Cita...');
    const requestRes = await request('/appointments/request', 'POST', {
        petId: 10, // Asegúrate de que este ID sea válido (Benito/Max)
        appointmentDate: '2026-01-20',
        appointmentTime: '10:00',
        serviceType: 'Consulta General',
        notes: 'Prueba desde script de verificación'
    }, token);

    if (requestRes.status === 201) {
        console.log('✅ CITA CREADA CON ÉXITO!');
        console.log('   ID:', requestRes.data.data.appointment.id);
        console.log('   Status:', requestRes.data.data.appointment.status);
    } else {
        console.log(`❌ FALLÓ LA CREACIÓN: ${requestRes.status}`);
        console.log('   Error:', JSON.stringify(requestRes.data));
    }

    // 3. Get Pets
    console.log('\n3. Obteniendo Mascotas...');
    const petsRes = await request('/pets', 'GET', null, token);

    if (petsRes.status === 200) {
        console.log('✅ GET /pets OK');
        console.log('   Mascotas encontradas:', petsRes.data.length);
        console.log('   Data:', JSON.stringify(petsRes.data, null, 2));
    } else {
        console.log(`❌ FALLÓ GET /pets: ${petsRes.status}`);
        console.log('   Error:', JSON.stringify(petsRes.data));
    }
}

run();
