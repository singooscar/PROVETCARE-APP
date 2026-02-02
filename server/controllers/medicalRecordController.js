import { pool } from '../config/db.js';
import { generatePrescriptionPDF } from '../services/pdfService.js';
import NotificationService from '../services/notificationService.js';

/**
 * CONTROLADOR DE HISTORIAL MÉDICO
 * Maneja registros médicos y recetas con sistema de permisos
 */

// ============================================================================
// MEDICAL RECORDS (Historial Médico)
// ============================================================================

/**
 * Obtener historial médico de una mascota
 * Permisos: Admin puede ver todo, Cliente solo sus mascotas
 */
export const getMedicalHistory = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`[MEDICAL] Fetching history for pet ${petId}, user ${userId} (role: ${userRole})`);

        // Verificar que la mascota existe
        const petCheck = await pool.query(
            'SELECT id, owner_id FROM pets WHERE id = $1',
            [petId]
        );

        if (petCheck.rows.length === 0) {
            console.log(`[MEDICAL] Pet ${petId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            });
        }

        // Verificar permisos (solo si NO es admin)
        if (userRole !== 'admin') {
            if (petCheck.rows[0].owner_id !== userId) {
                console.log(`[MEDICAL] Permission denied for user ${userId} to view pet ${petId}`);
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este historial médico'
                });
            }
        }

        // Intentar obtener historial usando la vista
        let result;
        try {
            result = await pool.query(
                `SELECT * FROM v_medical_history_full 
                 WHERE pet_id = $1 
                 ORDER BY visit_date DESC, created_at DESC`,
                [petId]
            );
        } catch (viewError) {
            // Si la vista no existe, usar consulta directa
            console.warn('[MEDICAL] View not found, using direct query:', viewError.message);
            result = await pool.query(
                `SELECT mr.*, p.name as pet_name, p.species, p.breed,
                        u.full_name as owner_name, u.email as owner_email
                 FROM medical_records mr
                 JOIN pets p ON mr.pet_id = p.id
                 JOIN users u ON p.owner_id = u.id
                 WHERE mr.pet_id = $1
                 ORDER BY mr.visit_date DESC, mr.created_at DESC`,
                [petId]
            );
        }

        console.log(`[MEDICAL] Found ${result.rows.length} records for pet ${petId}`);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obteniendo historial médico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial médico',
            error: error.message
        });
    }
};

/**
 * Crear nuevo registro médico
 * Solo Admin/Veterinario
 */
export const createMedicalRecord = async (req, res) => {
    try {
        const {
            petId,
            appointmentId,
            visitDate,
            diagnosis,
            treatment,
            medications,
            weight,
            temperature,
            notes,
            // New vital signs
            heart_rate,
            respiratory_rate,
            mucous_membranes,
            capillary_refill_time,
            hydration_status,
            abdomen_palpation,
            lymph_nodes
        } = req.body;

        const vetId = req.user.id;

        // Obtener nombre del veterinario
        const vetResult = await pool.query(
            'SELECT full_name FROM users WHERE id = $1',
            [vetId]
        );
        const veterinarianName = vetResult.rows[0]?.full_name;

        const result = await pool.query(
            `INSERT INTO medical_records 
             (pet_id, appointment_id, visit_date, diagnosis, treatment, medications, 
              weight, temperature, notes, veterinarian_name, vet_id, 
              heart_rate, respiratory_rate, mucous_membranes, capillary_refill_time, 
              hydration_status, abdomen_palpation, lymph_nodes, 
              created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
                     $12, $13, $14, $15, $16, $17, $18, 
                     CURRENT_TIMESTAMP)
             RETURNING *`,
            [
                petId, appointmentId || null, visitDate, diagnosis, treatment, medications,
                weight || null, temperature || null, notes, veterinarianName, vetId,
                heart_rate || null, respiratory_rate || null, mucous_membranes, capillary_refill_time,
                hydration_status, abdomen_palpation, lymph_nodes
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Registro médico creado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando registro médico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear registro médico',
            error: error.message
        });
    }
};

/**
 * Actualizar registro médico
 * Solo Admin/Veterinario que lo creó
 */
export const updateMedicalRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            diagnosis, treatment, medications, weight, temperature, notes,
            heart_rate, respiratory_rate, mucous_membranes, capillary_refill_time,
            hydration_status, abdomen_palpation, lymph_nodes
        } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verificar que existe y permisos
        const recordCheck = await pool.query(
            'SELECT vet_id FROM medical_records WHERE id = $1',
            [id]
        );

        if (recordCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro médico no encontrado'
            });
        }

        // Solo admin o el vet que lo creó puede editarlo
        if (userRole !== 'admin' && recordCheck.rows[0].vet_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este registro'
            });
        }

        const result = await pool.query(
            `UPDATE medical_records 
             SET diagnosis = $1, treatment = $2, medications = $3, 
                 weight = $4, temperature = $5, notes = $6,
                 heart_rate = $7, respiratory_rate = $8, mucous_membranes = $9,
                 capillary_refill_time = $10, hydration_status = $11, 
                 abdomen_palpation = $12, lymph_nodes = $13,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $14
             RETURNING *`,
            [
                diagnosis, treatment, medications, weight, temperature, notes,
                heart_rate, respiratory_rate, mucous_membranes, capillary_refill_time,
                hydration_status, abdomen_palpation, lymph_nodes,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Registro médico actualizado',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando registro médico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar registro médico',
            error: error.message
        });
    }
};

// ============================================================================
// PRESCRIPTIONS (Recetas Médicas)
// ============================================================================

/**
 * Crear receta médica con PDF y notificación por email
 * Solo Admin/Veterinario
 */
export const createPrescription = async (req, res) => {
    const client = await pool.connect();

    try {
        const { petId, appointmentId, instructions, medications } = req.body;
        // medications = [{ name, dosage, duration, quantity }]

        await client.query('BEGIN');

        const vetId = req.user.id;

        // 1. Crear registro de receta
        const prescriptionRes = await client.query(
            `INSERT INTO prescriptions (appointment_id, pet_id, vet_id, instructions, status)
             VALUES ($1, $2, $3, $4, 'issued')
             RETURNING id`,
            [appointmentId || null, petId, vetId, instructions]
        );
        const prescriptionId = prescriptionRes.rows[0].id;

        // 2. Insertar medicamentos
        for (const med of medications) {
            await client.query(
                `INSERT INTO prescription_items 
                 (prescription_id, medication_name, dosage, duration, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [prescriptionId, med.name, med.dosage, med.duration, med.quantity]
            );
        }

        await client.query('COMMIT');

        // 3. Obtener datos completos para el PDF
        const detailsRes = await pool.query(`
            SELECT 
                p.name as petName, 
                p.species,
                u.full_name as ownerName,
                u.email as ownerEmail,
                v.full_name as vetName
            FROM pets p
            JOIN users u ON p.owner_id = u.id
            JOIN users v ON v.id = $1
            WHERE p.id = $2
        `, [vetId, petId]);

        if (detailsRes.rows.length === 0) {
            throw new Error('No se encontraron datos de la mascota');
        }

        const details = detailsRes.rows[0];

        // 4. Generar PDF
        const pdfData = {
            prescriptionId,
            petName: details.petname,
            species: details.species,
            ownerName: details.ownername,
            vetName: details.vetname,
            instructions,
            items: medications
        };

        console.log('📄 Generando PDF con datos:', pdfData);

        const pdfUrl = await generatePrescriptionPDF(prescriptionId, pdfData);

        // 5. Actualizar URL del PDF en BD
        await pool.query(
            'UPDATE prescriptions SET pdf_url = $1 WHERE id = $2',
            [pdfUrl, prescriptionId]
        );

        // 6. Enviar email con PDF adjunto
        try {
            await NotificationService.notifyPrescriptionEvent(
                'PRESCRIPTION_ISSUED',
                { id: prescriptionId, pdf_url: pdfUrl, ...pdfData },
                {
                    email: details.owneremail,
                    full_name: details.ownername
                },
                { pdfPath: pdfUrl }
            );
            console.log(`📧 Email de receta enviado a ${details.owneremail}`);
        } catch (emailError) {
            console.error('Error enviando email (no crítico):', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Receta creada exitosamente',
            data: {
                prescriptionId,
                pdfUrl: `http://localhost:5000${pdfUrl}`
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear receta',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Obtener recetas de una mascota
 * Permisos: Admin o dueño
 */
export const getPetPrescriptions = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verificar permisos
        if (userRole !== 'admin') {
            const petCheck = await pool.query(
                'SELECT owner_id FROM pets WHERE id = $1',
                [petId]
            );

            if (petCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Mascota no encontrada'
                });
            }

            if (petCheck.rows[0].owner_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver estas recetas'
                });
            }
        }

        // Obtener recetas con items
        const result = await pool.query(`
            SELECT 
                pr.id,
                pr.appointment_id,
                pr.instructions,
                pr.pdf_url,
                pr.status,
                pr.created_at,
                v.full_name as vet_name,
                jsonb_agg(
                    jsonb_build_object(
                        'id', pi.id,
                        'medication_name', pi.medication_name,
                        'dosage', pi.dosage,
                        'duration', pi.duration,
                        'quantity', pi.quantity
                    )
                ) as medications
            FROM prescriptions pr
            LEFT JOIN prescription_items pi ON pr.id = pi.prescription_id
            LEFT JOIN users v ON pr.vet_id = v.id
            WHERE pr.pet_id = $1
            GROUP BY pr.id, v.full_name
            ORDER BY pr.created_at DESC
        `, [petId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obteniendo recetas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recetas',
            error: error.message
        });
    }
};

/**
 * Vincular receta con registro médico
 * Solo Admin/Veterinario
 */
export const linkPrescriptionToMedicalRecord = async (req, res) => {
    try {
        const { medicalRecordId, prescriptionId } = req.body;

        await pool.query(
            'UPDATE medical_records SET prescription_id = $1 WHERE id = $2',
            [prescriptionId, medicalRecordId]
        );

        res.json({
            success: true,
            message: 'Receta vinculada al registro médico'
        });

    } catch (error) {
        console.error('Error vinculando receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vincular receta',
            error: error.message
        });
    }
};

/**
 * Obtener datos de consulta por ID de cita
 * Si existe registro médico, lo devuelve. Si no, devuelve datos base de la cita.
 */
export const getConsultationByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // 1. Buscar si ya existe un registro médico para esta cita
        const recordRes = await pool.query(
            `SELECT * FROM medical_records WHERE appointment_id = $1`,
            [appointmentId]
        );

        if (recordRes.rows.length > 0) {
            // Ya existe la consulta, devolver datos completos
            const consultation = recordRes.rows[0];

            // Obtener datos mascota/dueño
            const detailsRes = await pool.query(
                `SELECT p.*, u.full_name as owner_name, u.email as owner_email
                 FROM pets p 
                 JOIN users u ON p.owner_id = u.id 
                 WHERE p.id = $1`,
                [consultation.pet_id]
            );

            return res.json({
                success: true,
                exists: true,
                data: {
                    ...consultation,
                    pet: detailsRes.rows[0]
                }
            });
        }

        // 2. Si no existe, buscar datos de la cita para iniciar
        const appointmentRes = await pool.query(
            `SELECT a.*, p.id as pet_id, p.name as pet_name, p.species, p.breed, p.age, p.weight as current_weight, p.photo_url,
                    u.id as client_id, u.full_name as client_name, u.email as client_email
             FROM appointments a
             JOIN pets p ON a.pet_id = p.id
             JOIN users u ON a.client_id = u.id
             WHERE a.id = $1`,
            [appointmentId]
        );

        if (appointmentRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            exists: false,
            appointment: appointmentRes.rows[0]
        });

    } catch (error) {
        console.error('Error obteniendo consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos de consulta',
            error: error.message
        });
    }
};
