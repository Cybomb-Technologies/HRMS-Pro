const pdf = require('html-pdf');

class PDFGenerator {
  constructor() {
    this.options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      header: {
        height: '0mm'
      },
      footer: {
        height: '0mm'
      },
      type: 'pdf',
      quality: '100'
    };
  }

  async generatePDF(htmlContent) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Generating PDF with html-pdf...');
      
      pdf.create(htmlContent, this.options).toBuffer((error, buffer) => {
        if (error) {
          console.error('❌ PDF generation failed:', error);
          reject(new Error(`PDF generation failed: ${error.message}`));
        } else {
          console.log(`✅ PDF generated successfully, size: ${buffer.length} bytes`);
          
          // Validate PDF buffer
          if (buffer && Buffer.isBuffer(buffer) && buffer.length > 0) {
            resolve(buffer);
          } else {
            reject(new Error('Generated PDF buffer is empty or invalid'));
          }
        }
      });
    });
  }
}

// Create singleton instance
const pdfGenerator = new PDFGenerator();

module.exports = pdfGenerator;