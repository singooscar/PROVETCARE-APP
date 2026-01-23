import { pool } from '../config/db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createInvoice = async (req, res) => {
    // ... existing implementation ...
    // To save specific logic implementation, I'll copy the logic from view_file if needed?
    // Actually, createInvoice logic is complex. I should KEEP it.
    // I already have the content from view_file Step 1056. I will copy it back.

    // WAIT. If I rewrite the file, I must include the existing `createInvoice` logic.
    // I can't just put "..."
    // I will copy-paste the logic from Step 1056 manually.

    const client = await pool.connect();
    try {
        const { appointmentId, items, notes } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'La factura debe tener items' });
        }
        await client.query('BEGIN');
        const aptRes = await client.query(`
            SELECT a.id, a.pet_id, p.owner_id as client_id, 
                   u.full_name as client_name, p.name as pet_name
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users u ON p.owner_id = u.id
            WHERE a.id = $1
        `, [appointmentId]);
        if (aptRes.rows.length === 0) {
            throw new Error('Cita no encontrada');
        }
        const aptData = aptRes.rows[0];
        let subtotal = 0;
        const processedItems = items.map(item => {
            const total = item.quantity * item.unitPrice;
            subtotal += total;
            return { ...item, total };
        });
        const tax = 0;
        const total = subtotal + tax;
        const invoiceNumber = `FAC-${Date.now().toString().slice(-6)}`;
        const invoiceRes = await client.query(`
            INSERT INTO invoices 
            (appointment_id, client_id, pet_id, vet_id, invoice_number, subtotal, tax, total, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [
            appointmentId,
            aptData.client_id,
            aptData.pet_id,
            req.user.id,
            invoiceNumber,
            subtotal,
            tax,
            total,
            notes
        ]);
        const invoiceId = invoiceRes.rows[0].id;
        for (const item of processedItems) {
            await client.query(`
                INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
                VALUES ($1, $2, $3, $4, $5)
            `, [invoiceId, item.description, item.quantity, item.unitPrice, item.total]);
        }
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `factura_${invoiceNumber}.pdf`;
        const relativePath = `/uploads/invoices/${fileName}`;
        const filePath = path.join(__dirname, '../../public', relativePath);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        doc.fillColor('#444444').fontSize(20).text('PROVETCARE', 50, 57)
            .fontSize(10).text('Clínica Veterinaria', 50, 80)
            .text('Calle 123, Bogotá', 50, 95)
            .text('admin@provetcare.com', 50, 110).moveDown();
        doc.fillColor('#000000').fontSize(20).text('FACTURA DE VENTA', 350, 57, { align: 'right' })
            .fontSize(10).text(`No: ${invoiceNumber}`, 350, 85, { align: 'right' })
            .text(`Fecha: ${new Date().toLocaleDateString()}`, 350, 100, { align: 'right' });
        doc.moveDown();
        doc.text(`Cliente: ${aptData.client_name}`, 50, 160).text(`Paciente: ${aptData.pet_name}`, 50, 175);
        let y = 220;
        doc.font('Helvetica-Bold').text('Descripción', 50, y).text('Cant', 280, y, { width: 50, align: 'center' })
            .text('Precio Unit', 330, y, { width: 100, align: 'right' }).text('Total', 430, y, { width: 100, align: 'right' });
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        y += 25;
        doc.font('Helvetica');
        processedItems.forEach(item => {
            doc.text(item.description, 50, y).text(item.quantity.toString(), 280, y, { width: 50, align: 'center' })
                .text(`$${item.unitPrice}`, 330, y, { width: 100, align: 'right' }).text(`$${item.total}`, 430, y, { width: 100, align: 'right' });
            y += 20;
        });
        doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();
        y += 25;
        doc.font('Helvetica-Bold').text('Total a Pagar:', 330, y, { width: 100, align: 'right' })
            .text(`$${total.toFixed(2)}`, 430, y, { width: 100, align: 'right' });
        doc.fontSize(10).text('¡Gracias por confiar en ProVetCare!', 50, 700, { align: 'center', width: 500 });
        doc.end();
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
        await client.query('UPDATE invoices SET pdf_url = $1 WHERE id = $2', [relativePath, invoiceId]);
        await client.query('COMMIT');
        const pdfBuffer = fs.readFileSync(filePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando factura:', error);
        res.status(500).json({ success: false, message: 'Error generando la factura', error: error.message });
    } finally {
        client.release();
    }
};

export const getInvoices = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener factura' });
    }
};

export const downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT pdf_url FROM invoices WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

        const relativePath = result.rows[0].pdf_url;
        if (!relativePath) return res.status(404).json({ error: 'PDF no generado' });

        const filePath = path.join(__dirname, '../../public', relativePath);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al descargar factura' });
    }
};
