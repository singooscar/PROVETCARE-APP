const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Script para convertir archivos Markdown a PDF con formato profesional
 * Utiliza Pandoc para la conversión con opciones de formato optimizadas
 */

const markdownFiles = [
    'SEMANA_1_ANALISIS_RENDIMIENTO.md',
    'SEMANA_2_MEDIDAS_SEGURIDAD.md',
    'SEMANA_3_PRUEBAS_VULNERABILIDAD.md',
    'SEMANA_4_BACKUPS_MONITOREO.md',
    'SEMANA_5_PRUEBAS_USUARIO.md',
    'SEMANA_6_MONITOREO_FINAL.md'
];

const docsDir = path.join(__dirname, '.');

async function convertMarkdownToPDF(markdownFile) {
    const inputPath = path.join(docsDir, markdownFile);
    const outputPath = path.join(docsDir, markdownFile.replace('.md', '.pdf'));

    console.log(`\n📄 Convirtiendo: ${markdownFile}`);

    try {
        // Comando Pandoc con opciones para mejor formato
        const pandocCommand = `pandoc "${inputPath}" -o "${outputPath}" ` +
            `--pdf-engine=xelatex ` +
            `--variable mainfont="Arial" ` +
            `--variable monofont="Courier New" ` +
            `--variable fontsize=11pt ` +
            `--variable geometry:margin=2.5cm ` +
            `--variable linestretch=1.5 ` +
            `--highlight-style=tango ` +
            `--table-of-contents ` +
            `--number-sections ` +
            `--standalone`;

        const { stdout, stderr } = await execPromise(pandocCommand);

        if (stderr && !stderr.includes('Warning')) {
            console.error(`⚠️  Advertencias: ${stderr}`);
        }

        console.log(`✅ PDF creado exitosamente: ${path.basename(outputPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Error al convertir ${markdownFile}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando conversión de Markdown a PDF...\n');
    console.log('📋 Archivos a procesar:', markdownFiles.length);

    let successCount = 0;

    for (const file of markdownFiles) {
        const success = await convertMarkdownToPDF(file);
        if (success) successCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Proceso completado: ${successCount}/${markdownFiles.length} archivos convertidos`);
    console.log('='.repeat(50));
}

main().catch(console.error);
