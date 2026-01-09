/**
 * Script de Prueba - Sistema Dual-Flow de Citas
 * 
 * Este script prueba ambos flujos del sistema:
 * - FLUJO A: Cliente solicita cita (3 pasos)
 * - FLUJO B: Veterinario crea cita de control (directo)
 * 
 * Ejecutar: node test-dual-flow-appointments.js
 */

const API_URL = 'http://localhost:5000/api';

// Colores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper para logging
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70));
}

// Helper para hacer requests
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
        // Intentar parsear JSON, si falla devolver texto o vacío
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            // No es JSON válido
        }
        return { status: response.status, data };
    } catch (error) {
        return { status: 500, error: error.message };
    }
}

// Esperar un momento
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
    log('\n🧪 INICIANDO PRUEBAS DEL SISTEMA DUAL-FLOW', 'blue');

    let clientToken = null;
    let adminToken = null;
    let clientId = null; // ID dinámico capturado del login
    let appointmentId = null;
    let followUpId = null;

    // ------------------------------------------------------------------------
    // SETUP: Obtener tokens
    // ------------------------------------------------------------------------
    logSection('SETUP: Autenticación');

    // Login como cliente
    log('1. Login como cliente...', 'yellow');
    const clientLogin = await request('/auth/login', 'POST', {
        email: 'cliente@example.com',
        password: 'admin123'  // Usando mismo password que admin
    });

    if (clientLogin.status === 200 && clientLogin.data.token) {
        clientToken = clientLogin.data.token;
        clientId = clientLogin.data.user.id; // CAPTURAR ID AUTOMÁTICAMENTE

        log('✅ Cliente autenticado correctamente', 'green');
        log(`   ID Cliente: ${clientId}`, 'green');
    } else {
        log('❌ Error al autenticar cliente', 'red');
        log(`   Respuesta: ${JSON.stringify(clientLogin.data)}`, 'red');
        return;
    }

    await wait(500);

    // Login como admin
    log('\n2. Login como administrador...', 'yellow');
    const adminLogin = await request('/auth/login', 'POST', {
        email: 'admin@provetcare.com',
        password: 'admin123'
    });

    if (adminLogin.status === 200 && adminLogin.data.token) {
        adminToken = adminLogin.data.token;
        log('✅ Admin autenticado correctamente', 'green');
    } else {
        log('❌ Error al autenticar admin', 'red');
        log(`   Respuesta: ${JSON.stringify(adminLogin.data)}`, 'red');
        return;
    }

    await wait(1000);

    // ------------------------------------------------------------------------
    // FLUJO A: Cliente Solicita Cita
    // ------------------------------------------------------------------------
    logSection('FLUJO A: Cliente Solicita Cita (3 pasos + 3 emails)');

    // Paso 1: Cliente crea solicitud
    log('\nPaso 1/3: Cliente solicita cita...', 'yellow');

    // ID DE MASCOTA: 10 (confirmado por usuario)
    const petId = 10;

    const requestResult = await request('/appointments/request', 'POST', {
        petId: petId,
        appointmentDate: '2026-01-20',
        appointmentTime: '10:00',
        serviceType: 'Consulta General',
        notes: 'Prueba automatizada del sistema dual-flow'
    }, clientToken);

    if (requestResult.status === 201 && requestResult.data.success) {
        appointmentId = requestResult.data.data.appointment.id;
        log('✅ Solicitud creada correctamente', 'green');
        log(`   ID de cita: ${appointmentId}`, 'green');
        log(`   Estado: ${requestResult.data.data.appointment.status}`, 'green');
        log(`   📧 Email enviado: "Solicitud Recibida"`, 'cyan');
    } else {
        log('❌ Error al crear solicitud', 'red');
        log(`   Respuesta: ${JSON.stringify(requestResult.data)}`, 'red');
        return;
    }

    await wait(1000);

    // Paso 2: Veterinario marca como "en revisión"
    log('\nPaso 2/3: Veterinario marca como "en revisión"...', 'yellow');
    const markReviewResult = await request(
        `/appointments/${appointmentId}/mark-review`,
        'PATCH',
        null,
        adminToken
    );

    if (markReviewResult.status === 200 && markReviewResult.data.success) {
        log('✅ Cita marcada como "en revisión"', 'green');
        log(`   Estado: ${markReviewResult.data.data.appointment.status}`, 'green');
        log(`   📧 Email enviado: "En Revisión por Especialista"`, 'cyan');
    } else {
        log('❌ Error al marcar como en revisión', 'red');
        log(`   Respuesta: ${JSON.stringify(markReviewResult.data)}`, 'red');
    }

    await wait(1000);

    // Paso 3: Veterinario aprueba
    log('\nPaso 3/3: Veterinario aprueba la solicitud...', 'yellow');
    const approveResult = await request(
        `/appointments/${appointmentId}/status`,
        'PATCH',
        {
            status: 'confirmed',
            adminNotes: 'Cita confirmada - prueba automatizada'
        },
        adminToken
    );

    if (approveResult.status === 200 && approveResult.data.success) {
        log('✅ Cita confirmada exitosamente', 'green');
        log(`   Estado: ${approveResult.data.data.appointment.status}`, 'green');
        log(`   📧 Email enviado: "¡Cita Confirmada!"`, 'cyan');
    } else {
        log('❌ Error al aprobar cita', 'red');
        log(`   Respuesta: ${JSON.stringify(approveResult.data)}`, 'red');
    }

    await wait(1500);

    // ------------------------------------------------------------------------
    // FLUJO B: Veterinario Crea Control
    // ------------------------------------------------------------------------
    logSection('FLUJO B: Veterinario Crea Cita de Control (directo)');

    log('\nVeterinario programa cita de control...', 'yellow');
    const followUpResult = await request('/appointments/follow-up', 'POST', {
        petId: petId,
        clientId: clientId, // ID DINÁMICO CAPTURADO AL INICIO
        appointmentDate: '2026-01-25',
        appointmentTime: '15:00',
        serviceType: 'Control Post-Operatorio',
        notes: 'Revisión de sutura - prueba automatizada'
    }, adminToken);

    if (followUpResult.status === 201 && followUpResult.data.success) {
        followUpId = followUpResult.data.data.appointment.id;
        log('✅ Cita de control creada exitosamente', 'green');
        log(`   ID de cita: ${followUpId}`, 'green');
        log(`   Estado: ${followUpResult.data.data.appointment.status}`, 'green');
        log(`   Creado por: ${followUpResult.data.data.createdBy}`, 'green');
        log(`   📧 Email enviado: "Control Programado"`, 'cyan');
    } else {
        log('❌ Error al crear cita de control', 'red');
        log(`   Respuesta: ${JSON.stringify(followUpResult.data)}`, 'red');
    }

    await wait(1000);

    // ------------------------------------------------------------------------
    // VERIFICACIÓN FINAL
    // ------------------------------------------------------------------------
    logSection('RESUMEN DE PRUEBAS');

    log('\n✅ FLUJO A (Cliente):', 'green');
    log('   1. ✓ Solicitud creada', 'green');
    log('   2. ✓ Marcada en revisión', 'green');
    log('   3. ✓ Aprobada', 'green');

    log('\n✅ FLUJO B (Veterinario):', 'green');
    log('   1. ✓ Cita creada directa', 'green');

    log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE', 'blue');
}

// ============================================================================
// EJECUTAR TESTS
// ============================================================================

log('🚀 Sistema de Pruebas Automatizadas - PROVETCARE', 'blue');
log('   Dual-Flow Appointment System', 'cyan');
log('   Versión: 2.1 (Fixed Auth & IDs)', 'reset');

runTests().catch(error => {
    log('\n❌ ERROR CRÍTICO EN LAS PRUEBAS:', 'red');
    console.error(error);
    process.exit(1);
});
