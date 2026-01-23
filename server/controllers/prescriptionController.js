import { pool } from '../config/db.js';
import { generatePrescriptionPDF } from '../services/pdfService.js';
import NotificationService from '../services/notificationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Crear receta médica y devolver PDF para descarga directa
 * POST /api/prescriptions
 */
export const createPrescription = async (req, res) => {
    const client = await pool.connect();

    try {
        const { petId, appointmentId, instructions, medications } = req.body;

        console.log('📋 Creando receta médica...');
        console.log('   Pet ID:', petId);
        console.log('   Medicamentos:', medications?.length || 0);

        // Validar datos
        if (!petId || !medications || medications.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requiere petId y al menos un medicamento.'
            });
        }

        await client.query('BEGIN');

        const vetId = req.user.id;

        // 1. Crear registro de receta
        const prescriptionRes = await client.query(
            `INSERT INTO prescriptions (appointment_id, pet_id, vet_id, instructions, status)
             VALUES ($1, $2, $3, $4, 'issued')
             RETURNING id`,
            [appointmentId || null, petId, vetId, instructions || '']
        );
        const prescriptionId = prescriptionRes.rows[0].id;

        console.log('✅ Receta ID:', prescriptionId);

        // 2. Insertar medicamentos
        for (const med of medications) {
            await client.query(
                `INSERT INTO prescription_items 
                 (prescription_id, medication_name, dosage, duration, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [prescriptionId, med.name, med.dosage, med.duration, med.quantity]
            );
        }

        console.log('✅ Medicamentos insertados');

        await client.query('COMMIT');

        // 3. Obtener datos completos para el PDF
        const detailsRes = await pool.query(`
            SELECT 
                p.name AS "petName", 
                p.species,
                u.full_name AS "ownerName",
                u.email AS "ownerEmail",
                v.full_name AS "vetName"
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
            petName: details.petName,
            species: details.species,
            ownerName: details.ownerName,
            vetName: details.vetName,
            instructions: instructions || 'Sin instrucciones adicionales',
            items: medications
        };

        console.log('📄 Generando PDF...');

        const pdfUrl = await generatePrescriptionPDF(prescriptionId, pdfData);

        console.log('✅ PDF generado:', pdfUrl);

        // 5. Actualizar URL del PDF en BD
        await pool.query(
            'UPDATE prescriptions SET pdf_url = $1 WHERE id = $2',
            [pdfUrl, prescriptionId]
        );

        // 6. Leer el archivo PDF generado
        const pdfPath = path.join(__dirname, '../..', pdfUrl);

        if (!fs.existsSync(pdfPath)) {
            throw new Error('PDF generado pero no se encuentra en el servidor');
        }

        const pdfBuffer = fs.readFileSync(pdfPath);

        console.log('✅ PDF leído, enviando al cliente...');

        // 7. Enviar PDF directamente al navegador
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receta_${prescriptionId}_${details.petname}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

        // 8. Intentar enviar email (no bloqueante)
        setImmediate(async () => {
            try {
                await NotificationService.init();
                await NotificationService.notifyPrescriptionEvent(
                    'PRESCRIPTION_ISSUED',
                    { id: prescriptionId, pdf_url: pdfUrl, ...pdfData },
                    {
                        email: details.ownerEmail,
                        full_name: details.ownerName
                    },
                    { pdfPath: pdfUrl }
                );
                console.log(`📧 Email de receta enviado a ${details.ownerEmail}`);
            } catch (emailError) {
                console.error('⚠️  Error enviando email (no crítico):', emailError.message);
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creando receta:', error);

        // Respuesta de error estructurada
        res.status(500).json({
            success: false,
            message: 'Error al crear la receta médica',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        client.release();
    }
};

/**
 * Obtener recetas de una mascota
 * GET /api/prescriptions/pet/:petId
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
 * Descargar PDF de una receta específica
 * GET /api/prescriptions/:id/download
 */
export const downloadPrescriptionPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Obtener receta
        const result = await pool.query(`
            SELECT 
                pr.id,
                pr.pdf_url,
                p.owner_id,
                p.name as pet_name
            FROM prescriptions pr
            JOIN pets p ON pr.pet_id = p.id
            WHERE pr.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Receta no encontrada'
            });
        }

        const prescription = result.rows[0];

        // Verificar permisos
        if (userRole !== 'admin' && prescription.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para descargar esta receta'
            });
        }

        // Leer PDF
        const pdfPath = path.join(__dirname, '../..', prescription.pdf_url);

        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo PDF no encontrado'
            });
        }

        const pdfBuffer = fs.readFileSync(pdfPath);

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receta_${id}_${prescription.pet_name}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error descargando PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar PDF',
            error: error.message
        });
    }
};
