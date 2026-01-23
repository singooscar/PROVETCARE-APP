import PDFDocument from 'pdfkit';
console.log('✅ PDFKit imported successfully');
try {
    const doc = new PDFDocument();
    console.log('✅ PDFDocument instance created');
} catch (e) {
    console.error('❌ Error creating PDFDocument instance', e);
}
