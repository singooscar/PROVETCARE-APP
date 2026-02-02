// TEST: Probar registro de veterinario directamente
// Ejecutar con: node test-vet-register.js

const testRegistration = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/admin/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Dr. Oscar Sanchez',
                email: 'oscar@gmail.com',
                password: 'Veterinario123!',
                phone: '+12312312',
                invitationCode: 'veterinaria2026'
            })
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ REGISTRO EXITOSO!');
            console.log('Token:', data.data.token);
        } else {
            console.log('\n❌ ERROR EN REGISTRO');
            console.log('Mensaje:', data.message);
        }

    } catch (error) {
        console.error('Error de conexión:', error.message);
    }
};

testRegistration();
