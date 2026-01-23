const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'POST', body = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    };

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
    console.log('🔍 PROBANDO REGISTRO VETERINARIO');

    const vetData = {
        name: 'Veronica Alarcon',
        email: 'vero@gmail.com', // Probando el email del usuario
        password: 'Password123!',
        phone: '+592961771991',
        invitationCode: 'VET2026'
    };

    console.log('Sending data:', vetData);

    const res = await request('/auth/register-admin', 'POST', vetData);

    if (res.status === 201) {
        console.log('✅ REGISTRO VETERINARIO EXITOSO!');
        console.log('   User:', res.data.data.user.email);
    } else {
        console.log(`❌ FALLÓ REGISTRO: ${res.status}`);
        console.log('   Error:', JSON.stringify(res.data, null, 2));
    }
}

run();
