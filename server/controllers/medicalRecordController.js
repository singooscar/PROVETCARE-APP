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
                    message: 'No tienes permiso para ver este historial médico'
                });
            }
        }

        // Obtener historial completo usando la vista
        const result = await pool.query(
            `SELECT * FROM v_medical_history_full 
             WHERE pet_id = $1 
             ORDER BY visit_date DESC, created_at DESC`,
            [petId]
        );

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
            notes
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
              weight, temperature, notes, veterinarian_name, vet_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
             RETURNING *`,
            [petId, appointmentId || null, visitDate, diagnosis, treatment, medications,
                weight || null, temperature || null, notes, veterinarianName, vetId]
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
        const { diagnosis, treatment, medications, weight, temperature, notes } = req.body;
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
                 weight = $4, temperature = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [diagnosis, treatment, medications, weight, temperature, notes, id]
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
