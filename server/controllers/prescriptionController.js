import { pool } from '../config/db.js';
import { generatePrescriptionPDF } from '../services/pdfService.js';

export const createPrescription = async (req, res) => {
    const client = await pool.connect();

    try {
        const { appointmentId, petId, instructions, items } = req.body;
        // items = [{ inventoryItemId, quantity, dosage, duration, unitPrice, name }]

        // Fetch extra data for PDF (Pet Name, Owner Name, Vet Name)
        // We do this before transaction or inside? Inside is safer for data consistency.

        await client.query('BEGIN');

        // 1. Obtener ID del veterinario (usuario autenticado)
        const vetId = req.user.id;

        // 2. Crear registro de Receta
        const prescriptionRes = await client.query(
            `INSERT INTO prescriptions (appointment_id, pet_id, vet_id, instructions, status)
             VALUES ($1, $2, $3, $4, 'issued')
             RETURNING id`,
            [appointmentId, petId, vetId, instructions]
        );
        const prescriptionId = prescriptionRes.rows[0].id;

        // 3. Buscar o Crear Factura (Invoice) para esta cita
        // Si no existe, se crea en estado 'draft'
        let invoiceId;
        const invoiceCheck = await client.query(
            'SELECT id, total_amount FROM invoices WHERE appointment_id = $1',
            [appointmentId]
        );

        if (invoiceCheck.rows.length > 0) {
            invoiceId = invoiceCheck.rows[0].id;
        } else {
            // Obtener cliente de la cita para crear la factura
            const apptRes = await client.query('SELECT client_id FROM appointments WHERE id = $1', [appointmentId]);
            const clientId = apptRes.rows[0].client_id;

            const newInvoice = await client.query(
                `INSERT INTO invoices (appointment_id, client_id, total_amount, status)
                 VALUES ($1, $2, 0.00, 'draft')
                 RETURNING id`,
                [appointmentId, clientId]
            );
            invoiceId = newInvoice.rows[0].id;
        }

        // 4. Procesar Ítems (Insertar en Receta y en Factura)
        for (const item of items) {
            // A. Insertar en prescription_items
            await client.query(
                `INSERT INTO prescription_items (prescription_id, inventory_item_id, quantity, dosage, duration)
                 VALUES ($1, $2, $3, $4, $5)`,
                [prescriptionId, item.id, item.quantity, item.dosage, item.duration]
            );

            // B. Insertar en invoice_items (Cobro)
            // Calculamos el total de la línea
            const lineTotal = item.unit_price * item.quantity;

            await client.query(
                `INSERT INTO invoice_items (invoice_id, item_type, item_id, description, quantity, unit_price)
                 VALUES ($1, 'pharmacy', $2, $3, $4, $5)`,
                [invoiceId, item.id, item.name, item.quantity, item.unit_price]
            );

            // C. Actualizar total de la factura
            await client.query(
                `UPDATE invoices 
                 SET total_amount = total_amount + $1 
                 WHERE id = $2`,
                [lineTotal, invoiceId]
            );
        }

        await client.query('COMMIT');

        // 5. Generar PDF (Async)
        try {
            const detailsRes = await pool.query(`
                SELECT p.name as petName, p.species, u.full_name as ownerName, v.full_name as vetName
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN users u ON a.client_id = u.id
                JOIN users v ON v.id = $1
                WHERE a.id = $2
            `, [vetId, appointmentId]);

            if (detailsRes.rows.length > 0) {
                const details = detailsRes.rows[0];
                const pdfData = {
                    prescriptionId,
                    petName: details.petName,
                    species: details.species,
                    ownerName: details.ownerName,
                    vetName: details.vetName, // Fallback si no viene en join
                    instructions,
                    items
                };

                const pdfUrl = await generatePrescriptionPDF(prescriptionId, pdfData);

                // Actualizar URL en BD
                await pool.query('UPDATE prescriptions SET pdf_url = $1 WHERE id = $2', [pdfUrl, prescriptionId]);
            }
        } catch (pdfErr) {
            console.error('Error generando PDF:', pdfErr);
        }

        res.status(201).json({
            success: true,
            message: 'Receta creada y cargada a la cuenta exitosamente',
            prescriptionId: prescriptionId,
            invoiceId: invoiceId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la receta',
            error: error.message
        });
    } finally {
        client.release();
    }
};
