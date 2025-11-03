// utils/pdfGenerator.js
const puppeteer = require('puppeteer');
const path = require('path');

const generatePDF = async (htmlContent, options = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      ...options
    });

    await browser.close();
    return pdf;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
};

module.exports = { generatePDF };