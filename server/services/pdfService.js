import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Template HTML mejorado para PDF
const getTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: A4; margin: 20mm; }
        body { 
            font-family: 'Helvetica Neue', 'Arial', sans-serif; 
            color: #1a1a1a; 
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container { max-width: 100%; }
        
        /* Header */
        .header { 
            border-bottom: 4px solid #10b981; 
            padding-bottom: 15px; 
            margin-bottom: 25px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
        }
        .brand h1 { 
            margin: 0; 
            color: #10b981; 
            font-size: 32px; 
            font-weight: 700;
        }
        .brand p { 
            margin: 5px 0 0; 
            color: #666; 
            font-size: 14px; 
        }
        .meta { 
            text-align: right; 
            font-size: 13px;
            color: #555;
        }
        .meta p { margin: 3px 0; }
        
        /* Secciones */
        .section { margin-bottom: 25px; page-break-inside: avoid; }
        .section-title { 
            font-size: 15px; 
            font-weight: 700; 
            color: #10b981; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
        }
        
        /* Info del paciente */
        .patient-info { 
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
        }
        .info-group label { 
            display: block; 
            font-size: 11px; 
            color: #6b7280; 
            text-transform: uppercase; 
            font-weight: 600;
            margin-bottom: 5px;
        }
        .info-group span { 
            font-size: 15px; 
            font-weight: 600;
            color: #111827;
        }
        
        /* Tabla de medicamentos */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
        }
        thead tr {
            background: #f3f4f6;
        }
        th { 
            text-align: left; 
            font-size: 12px; 
            color: #374151; 
            font-weight: 700;
            padding: 12px 10px; 
            border-bottom: 2px solid #d1d5db; 
        }
        td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #e5e7eb; 
            font-size: 13px; 
        }
        tr:last-child td {
            border-bottom: none;
        }
        td:first-child {
            font-weight: 600;
            color: #111827;
        }
        
        /* Instrucciones */
        .instructions { 
            background: #f0fdf4; 
            padding: 20px; 
            border-radius: 8px; 
            font-size: 13px; 
            line-height: 1.8;
            border-left: 4px solid #10b981;
        }
        
        /* Firma */
        .signature { 
            margin-top: 50px; 
            display: flex; 
            justify-content: flex-end; 
        }
        .sign-box { 
            text-align: center; 
            border-top: 2px solid #1f2937; 
            width: 220px; 
            padding-top: 10px; 
        }
        .sign-box .vet-name {
            font-weight: 600;
            color: #111827;
            margin-top: 5px;
        }
        
        /* Footer */
        .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 11px; 
            border-top: 1px solid #e5e7eb; 
            padding-top: 15px; 
        }
        .footer p { margin: 5px 0; }
        
        /* Marca de agua */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            opacity: 0.05;
            color: #10b981;
            z-index: -1;
            font-weight: 900;
        }
    </style>
</head>
<body>
    <div class="watermark">PROVETCARE</div>
    <div class="container">
        <div class="header">
            <div class="brand">
                <h1>🐾 PROVETCARE</h1>
                <p>Clínica Veterinaria Integral</p>
            </div>
            <div class="meta">
                <p><strong>Receta Médica #${data.prescriptionId}</strong></p>
                <p>Fecha: ${new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}</p>
                <p>Hora: ${new Date().toLocaleTimeString('es-ES')}</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📋 Información del Paciente</div>
            <div class="patient-info">
                <div class="info-group">
                    <label>Mascota</label>
                    <span>${data.petName}</span>
                </div>
                <div class="info-group">
                    <label>Especie</label>
                    <span>${data.species}</span>
                </div>
                <div class="info-group">
                    <label>Propietario</label>
                    <span>${data.ownerName}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">💊 Prescripción Médica</div>
            <table>
                <thead>
                    <tr>
                        <th>Medicamento</th>
                        <th>Dosis / Frecuencia</th>
                        <th>Duración</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                    <tr>
                        <td><strong>${item.name || item.medication_name}</strong></td>
                        <td>${item.dosage}</td>
                        <td>${item.duration}</td>
                        <td>${item.quantity} unidades</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">📝 Indicaciones Generales</div>
            <div class="instructions">
                ${data.instructions ? data.instructions.replace(/\n/g, '<br>') : 'Sin indicaciones adicionales.'}
            </div>
        </div>

        <div class="signature">
            <div class="sign-box">
                <div style="font-size: 11px; color: #6b7280;">Firma del Veterinario</div>
                <div class="vet-name">Dr. ${data.vetName}</div>
                <div style="font-size: 10px; color: #9ca3af; margin-top: 3px;">Médico Veterinario Colegiado</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>PROVETCARE</strong> - Clínica Veterinaria Integral</p>
            <p>Av. Principal 123, Ciudad - Tel: (55) 1234-5678 - Email: contacto@provetcare.com</p>
            <p style="margin-top: 10px; font-size: 10px;">
                Este documento es una receta médica digital válida. 
                Generado electrónicamente el ${new Date().toLocaleString('es-ES')}
            </p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Genera un archivo PDF de una receta médica usando Puppeteer
 * @param {number} prescriptionId - ID de la receta
 * @param {object} prescriptionData - Datos de la receta (petName, species, ownerName, vetName, instructions, items)
 * @returns {Promise<string>} URL relativa del PDF generado
 */
export const generatePrescriptionPDF = async (prescriptionId, prescriptionData) => {
    let browser;

    try {
        console.log(`📄 Generando PDF para receta #${prescriptionId}...`);

        // 1. Generar HTML
        const htmlContent = getTemplate(prescriptionData);

        // 2. Definir directorios
        const uploadsDir = path.join(__dirname, '../../uploads/prescriptions');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`✅ Directorio creado: ${uploadsDir}`);
        }

        // 3. Definir nombre de archivos
        const timestamp = Date.now();
        const pdfFileName = `receta_${prescriptionId}_${timestamp}.pdf`;
        const pdfFilePath = path.join(uploadsDir, pdfFileName);

        // 4. Lanzar Puppeteer y generar PDF
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Configurar contenido HTML
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        // Generar PDF con opciones optimizadas
        await page.pdf({
            path: pdfFilePath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        await browser.close();
        browser = null;

        console.log(`✅ PDF generado exitosamente: ${pdfFilePath}`);
        console.log(`📊 Tamaño: ${(fs.statSync(pdfFilePath).size / 1024).toFixed(2)} KB`);

        // 5. Retornar URL relativa
        return `/uploads/prescriptions/${pdfFileName}`;

    } catch (error) {
        console.error(`❌ Error generando PDF para receta #${prescriptionId}:`, error);

        // Cleanup del navegador si hubo error
        if (browser) {
            await browser.close();
        }

        throw new Error(`No se pudo generar el PDF: ${error.message}`);
    }
};

/**
 * Elimina un archivo PDF de receta
 * @param {string} pdfUrl - URL relativa del PDF (ej: /uploads/prescriptions/receta_1_123456.pdf)
 * @returns {Promise<boolean>} true si se eliminó exitosamente
 */
export const deletePrescriptionPDF = async (pdfUrl) => {
    try {
        if (!pdfUrl) return false;

        const fileName = path.basename(pdfUrl);
        const filePath = path.join(__dirname, '../../uploads/prescriptions', fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  PDF eliminado: ${filePath}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error eliminando PDF:', error);
        return false;
    }
};
