import { pool } from '../config/db.js';

// Obtener factura de un cliente o cita
export const getInvoice = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // 1. Buscar la factura
        const invoiceRes = await pool.query(
            `SELECT * FROM invoices WHERE appointment_id = $1`,
            [appointmentId]
        );

        if (invoiceRes.rows.length === 0) {
            return res.status(404).json({ message: 'No hay factura generada para esta cita' });
        }

        const invoice = invoiceRes.rows[0];

        // 2. Buscar los ítems
        const itemsRes = await pool.query(
            `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`,
            [invoice.id]
        );

        res.json({
            invoice: invoice,
            items: itemsRes.rows
        });

    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ error: 'Error al cargar factura' });
    }
};

// Crear PaymentIntent (Simulado o real con Stripe)
export const createPaymentIntent = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;

        // AQUÍ IRÍA LA LÓGICA REAL DE STRIPE
        // Por ahora simulamos una respuesta exitosa para el frontend

        // const paymentIntent = await stripe.paymentIntents.create({...})

        res.json({
            clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(7), // Simulado
            amount: amount
        });

    } catch (error) {
        console.error('Error en pago:', error);
        res.status(500).json({ error: 'Error al iniciar pago' });
    }
};
