# UNIVERSIDAD POLITÉCNICA SALESIANA
## FORMATO DE SEGUIMIENTO SEMANAL - PROYECTO DE TITULACIÓN

**Carrera:** Ingeniería en Sistemas / Computación  
**Período Académico:** 2025-2026  


---

# SEMANA 5: PRUEBAS DE USUARIO E INFORME

## UNIVERSIDAD POLITÉCNICA SALESIANA

**NOMBRE DEL PROYECTO:**  
Sistema Web para Agendamiento de Citas Veterinarias - PROVETCARE

**NOMBRE DEL ESTUDIANTE:**  
Oscar Singo

**OBJETIVO:**  
Validar usabilidad con usuarios reales y aplicar System Usability Scale (SUS).

**RESULTADO ESPERADO:**  
Score SUS > 68 y Tasa de Éxito > 80%.

**INDICADOR:**  
- Score SUS
- Tasa de Éxito por Tarea

**VALOR INICIAL DEL INDICADOR:**  
- SUS: N/A

**ACTIVIDAD:**  
1. Diseño de escenarios de prueba.
2. Ejecución con 5 usuarios.
3. Aplicación de encuesta SUS.

**EVIDENCIA DETALLADA:**

### 1. Resultados Pruebas de Usabilidad
- **Participantes:** 5 (3 Clientes, 1 Vet, 1 Admin).
- **Tasa de Éxito Promedio:** 88%.
- **Score SUS:** **78.5/100** (Nivel "Bueno").

### 2. Código de Justificación: Escenarios de Prueba

**Escenario Implementado (Test End-to-End):**
```javascript
// Escenario: Registro de Cliente y Cita
describe('Flujo Cliente Nuevo', () => {
    test('Registro -> Agregar Mascota -> Agendar Cita', async () => {
        // 1. Registro
        const user = await registerUser('Juan', 'juan@test.com');
        // 2. Mascota
        const pet = await createPet(user.token, 'Firulais');
        // 3. Cita
        const appointment = await scheduleAppointment(user.token, pet.id, '2026-03-10');
        
        expect(appointment.status).toBe('pending');
    });
});
```

---

**Firma del Estudiante:**  
Oscar Singo
