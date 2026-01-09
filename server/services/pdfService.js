import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Template HTML básico
const getTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
        .brand h1 { margin: 0; color: #10b981; font-size: 28px; }
        .brand p { margin: 5px 0 0; color: #666; font-size: 14px; }
        .meta { text-align: right; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; color: #10b981; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
        .patient-info { display: flex; gap: 40px; }
        .info-group label { display: block; font-size: 11px; color: #888; text-transform: uppercase; }
        .info-group span { font-size: 16px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; font-size: 12px; color: #888; padding: 10px; border-bottom: 1px solid #eee; }
        td { padding: 12px 10px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
        .instructions { background: #f9fafb; padding: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6; }
        .footer { margin-top: 50px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        .signature { margin-top: 40px; display: flex; justify-content: flex-end; }
        .sign-box { text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <h1>PROVETCARE</h1>
            <p>Clínica Veterinaria Integral</p>
        </div>
        <div class="meta">
            <p><strong>Receta #:</strong> ${data.prescriptionId}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Paciente</div>
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
        <div class="section-title">Prescripción Médica</div>
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
                    <td><strong>${item.name}</strong></td>
                    <td>${item.dosage}</td>
                    <td>${item.duration}</td>
                    <td>${item.quantity}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Indicaciones Generales</div>
        <div class="instructions">
            ${data.instructions.replace(/\n/g, '<br>')}
        </div>
    </div>

    <div class="signature">
        <div class="sign-box">
            Firma del Veterinario<br>
            <small>Dr. ${data.vetName}</small>
        </div>
    </div>

    <div class="footer">
        <p>ProVetCare - Av. Principal 123, Ciudad de México - Tel: (55) 1234-5678</p>
        <p>Este documento es una receta médica digital válida.</p>
    </div>
</body>
</html>
`;

export const generatePrescriptionPDF = async (prescriptionId, prescriptionData) => {
    // 1. Obtener datos completos
    const htmlContent = getTemplate(prescriptionData);

    // 2. Definir ruta de salida: server/uploads/prescriptions
    const uploadsDir = path.join(__dirname, '../../uploads/prescriptions');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 3. Crear archivo HTML
    const fileName = `receta_${prescriptionId}_${Date.now()}.html`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, htmlContent);

    console.log(`📄 Receta generada: ${filePath}`);

    // Retornamos la URL relativa que se guardará en BD
    return `/uploads/prescriptions/${fileName}`;
};
