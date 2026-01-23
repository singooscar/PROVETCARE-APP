import { pool } from '../config/db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener cargos pendientes (Por Cobrar)
export const getPendingCharges = async (req, res) => {
    try {
        const { clientId } = req.params;
        const result = await pool.query(
            `SELECT c.*, p.name as pet_name 
             FROM charges c 
             LEFT JOIN pets p ON c.pet_id = p.id
             WHERE c.client_id = $1 AND c.status IN ('PENDING', 'PARTIAL')
             ORDER BY c.created_at ASC`,
            [clientId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo cargos pendientes' });
    }
};

// Obtener historial de pagos y cargos pagados
export const getBillingHistory = async (req, res) => {
    try {
        const { clientId } = req.params;

        // Obtenemos los últimos 50 pagos
        const payments = await pool.query(
            `SELECT * FROM payments WHERE client_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [clientId]
        );

        // Obtenemos los últimos 50 cargos pagados
        const paidCharges = await pool.query(
            `SELECT c.*, p.name as pet_name 
             FROM charges c 
             LEFT JOIN pets p ON c.pet_id = p.id
             WHERE c.client_id = $1 AND c.status = 'PAID'
             ORDER BY c.updated_at DESC LIMIT 50`,
            [clientId]
        );

        res.json({
            payments: payments.rows,
            paidCharges: paidCharges.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo historial' });
    }
};

// Procesar Pago
export const processPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { clientId, chargeIds, paymentAmount, method, reference, notes } = req.body;
        // chargeIds: array of IDs selected
        // paymentAmount: Total amount paid by user

        await client.query('BEGIN');

        console.log(`💸 Procesando pago de $${paymentAmount} para cliente ${clientId}`);

        // 1. Obtener los cargos seleccionados para validar y bloquear filas
        const chargesRes = await client.query(
            `SELECT * FROM charges WHERE id = ANY($1) AND client_id = $2 FOR UPDATE`,
            [chargeIds, clientId]
        );

        let remainingPayment = parseFloat(paymentAmount);
        const paidItemsDetail = []; // Para el recibo PDF

        // 2. Crear registro de Pago
        const paymentRes = await client.query(
            `INSERT INTO payments (client_id, amount, method, reference, notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, result_url, created_at`,
            [clientId, paymentAmount, method, reference, notes]
        );
        const paymentId = paymentRes.rows[0].id;
        const paymentDate = paymentRes.rows[0].created_at;

        // 3. Distribuir el pago entre los cargos seleccionados
        for (const charge of chargesRes.rows) {
            if (remainingPayment <= 0) break;

            const amountDue = parseFloat(charge.total_amount) - parseFloat(charge.paid_amount);
            let applyAmount = 0;

            if (remainingPayment >= amountDue) {
                // Cubre todo el saldo restante de este cargo
                applyAmount = amountDue;
                remainingPayment -= amountDue;

                // Actualizar a PAID
                await client.query(
                    `UPDATE charges SET paid_amount = paid_amount + $1, status = 'PAID', updated_at = NOW() WHERE id = $2`,
                    [applyAmount, charge.id]
                );
            } else {
                // Pago Parcial
                applyAmount = remainingPayment;
                remainingPayment = 0;

                // Actualizar a PARTIAL
                await client.query(
                    `UPDATE charges SET paid_amount = paid_amount + $1, status = 'PARTIAL', updated_at = NOW() WHERE id = $2`,
                    [applyAmount, charge.id]
                );
            }

            // Registrar relación payment_charges
            await client.query(
                `INSERT INTO payment_charges (payment_id, charge_id, amount_applied) VALUES ($1, $2, $3)`,
                [paymentId, charge.id, applyAmount]
            );

            paidItemsDetail.push({
                description: charge.description,
                amount: applyAmount,
                total: charge.total_amount
            });
        }

        // 4. Generar Recibo PDF
        const pdfPath = await generateReceiptPDF(paymentId, clientId, paidItemsDetail, paymentAmount, method, paymentDate, client);

        // Actualizar URL en el pago
        const relativePath = `/uploads/receipts/${path.basename(pdfPath)}`;
        await client.query('UPDATE payments SET receipt_url = $1 WHERE id = $2', [relativePath, paymentId]);

        await client.query('COMMIT');

        res.json({ success: true, message: 'Pago procesado correctamente', receiptUrl: relativePath });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error procesando pago:', error);
        res.status(500).json({ error: 'Error procesando el pago' });
    } finally {
        client.release();
    }
};

// Crear un cargo manual (opcional, para testing o futuros usos)
export const createCharge = async (req, res) => {
    try {
        const { clientId, petId, description, amount } = req.body;
        await pool.query(
            `INSERT INTO charges (client_id, pet_id, description, total_amount, status)
             VALUES ($1, $2, $3, $4, 'PENDING')`,
            [clientId, petId, description, amount]
        );
        res.json({ success: true, message: 'Cargo creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// --- Helper: Generar PDF ---
async function generateReceiptPDF(paymentId, clientId, items, totalPaid, method, date, dbClient) {
    // Obtener datos del cliente
    const clientRes = await dbClient.query('SELECT full_name, email FROM users WHERE id = $1', [clientId]);
    const clientData = clientRes.rows[0];

    const fileName = `recibo_${paymentId}_${Date.now()}.pdf`;
    const relativePath = `/uploads/receipts/${fileName}`;
    const filePath = path.join(__dirname, '../../public', relativePath);

    // Asegurar directorio
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(18).text('PROVETCARE', { align: 'center' });
    doc.fontSize(12).text('Comprobante de Pago', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Fecha: ${new Date(date).toLocaleString()}`);
    doc.text(`Recibo Nro: ${paymentId}`);
    doc.text(`Cliente: ${clientData.full_name}`);
    doc.text(`Método de Pago: ${method}`);
    doc.moveDown();

    // Tabla
    const startY = doc.y;
    doc.text('Concepto', 50, startY, { bold: true });
    doc.text('Abonado', 400, startY, { bold: true, align: 'right' });
    doc.moveTo(50, startY + 15).lineTo(500, startY + 15).stroke();

    let y = startY + 30;
    items.forEach(item => {
        doc.text(item.description, 50, y);
        doc.text(`$${Number(item.amount).toFixed(2)}`, 400, y, { align: 'right' });
        y += 20;
    });

    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    doc.fontSize(12).text(`Total Pagado: $${Number(totalPaid).toFixed(2)}`, 400, y, { align: 'right', bold: true });

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}
