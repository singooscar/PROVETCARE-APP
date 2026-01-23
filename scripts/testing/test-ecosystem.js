const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = '') {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(url, options);
        let data = {};
        try {
            data = await response.json();
        } catch (e) { }
        return { status: response.status, data };
    } catch (e) {
        return { status: 500, error: e.message };
    }
}

async function runTest() {
    console.log('🧪 INICIANDO TEST DEL ECOSISTEMA...');

    // 1. Obtener Token de Admin (Vía Backdoor)
    console.log('\n1. Obteniendo Token de Admin (Backdoor)...');
    const tokenRes = await request('/dev-token', 'GET');

    if (!tokenRes.data.token) {
        console.error('❌ NO SE PUDO OBTENER TOKEN DE ADMIN.');
        console.error(tokenRes);
        return;
    }
    const token = tokenRes.data.token;
    console.log('✅ Token obtenido.');

    // 2. Obtener Inventario
    console.log('\n2. Obteniendo Inventario...');
    const invRes = await request('/inventory?search=Amoxicilina', 'GET', null, token);

    if (invRes.status !== 200) {
        console.error('❌ Error al obtener inventario:', invRes.data);
        return;
    }

    console.log('   Items encontrados:', invRes.data.length);
    if (invRes.data.length > 0) {
        console.log('   Item 1:', invRes.data[0].name, '- Stock:', invRes.data[0].stock);
    } else {
        console.warn('⚠️ No se encontró Amoxicilina. Verifica SEED data.');
        // Si no hay amoxicilina, buscamos OTRO
        const allInv = await request('/inventory', 'GET', null, token);
        if (allInv.data.length > 0) {
            console.log('   Usando alternativo:', allInv.data[0].name);
            invRes.data = [allInv.data[0]];
        } else {
            console.error('❌ INVENTARIO VACÍO. Abortando.');
            return;
        }
    }

    // 2.5 Obtener una Cita Válida
    console.log('\n2.5. Buscando una cita válida...');
    // Usamos el endpoint de admin para ver todas o el de cliente si tuviéramos
    // Endpoint: /api/appointments (Devuelve { success: true, data: [...] })
    const apptRes = await request('/appointments', 'GET', null, token);

    let appointmentId, petId;

    if (apptRes.data?.data?.appointments?.length > 0) {
        // Tomamos la primera cita
        const appt = apptRes.data.data.appointments[0];
        appointmentId = appt.id;
        petId = appt.pet_id;
        console.log(`   Usando Cita ID: ${appointmentId}, Pet ID: ${petId}`);
    } else {
        // Fallback or Abort
        // Si no hay citas, no podemos probar recetas vinculadas
        console.warn('⚠️ NO SE ENCONTRARON CITAS.');
        // Intentemos con la ID 1 si existe seed, si no, fallará.
        console.log('   Intentando IDs hardcoded (Backup)...');
        appointmentId = 1;
        petId = 1;
    }

    console.log(`\n3. Creando Receta para Cita ${appointmentId}...`);
    const prescriptionBody = {
        appointmentId: appointmentId,
        petId: petId,
        instructions: "Tomar con comida",
        items: [
            {
                id: invRes.data[0].id, // Amoxicilina o alternativo
                name: invRes.data[0].name,
                unit_price: invRes.data[0].unit_price,
                quantity: 2,
                dosage: "1 cada 12h",
                duration: "5 días"
            }
        ]
    };

    const prescRes = await request('/prescriptions', 'POST', prescriptionBody, token);

    if (prescRes.status === 201) {
        console.log('✅ Receta Creada ID:', prescRes.data.prescriptionId);
        console.log('✅ Factura Actualizada ID:', prescRes.data.invoiceId);

        // 4. Verificar Factura
        console.log('\n4. Verificando Factura...');
        const invoiceRes = await request(`/invoices/${appointmentId}`, 'GET', null, token);

        if (invoiceRes.status === 200) {
            const inv = invoiceRes.data.invoice;
            const items = invoiceRes.data.items;

            console.log('   Total Factura:', inv.total_amount);
            console.log('   Ítems en Factura:', items.length);
            console.table(items.map(i => ({
                desc: i.description,
                qty: i.quantity,
                price: i.unit_price,
                total: i.line_total
            })));
        } else {
            console.error('❌ Error al obtener factura:', invoiceRes.data);
        }

    } else {
        console.log(`❌ Falló creación receta: ${prescRes.status}`);
        console.log('   Error:', JSON.stringify(prescRes.data));
    }
}

runTest();
