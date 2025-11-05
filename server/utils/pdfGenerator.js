const puppeteer = require('puppeteer');

class PDFGenerator {
  constructor() {
    this.browser = null;
    this.browserPromise = null;
    this.isInitializing = false;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async init() {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isInitializing) {
      return this.browserPromise;
    }

    this.isInitializing = true;

    try {
      console.log('Initializing Puppeteer browser...');
      
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        timeout: 30000
      });

      this.browser = await this.browserPromise;
      
      console.log('Puppeteer browser initialized successfully');
      
      this.browser.on('disconnected', () => {
        console.log('Browser disconnected, cleaning up...');
        this.browser = null;
        this.browserPromise = null;
        this.isInitializing = false;
      });

      return this.browser;
    } catch (error) {
      this.isInitializing = false;
      this.browserPromise = null;
      console.error('Browser initialization failed:', error);
      throw error;
    }
  }

  async generatePDF(htmlContent, options = {}) {
    let retries = this.maxRetries;
    
    while (retries > 0) {
      let browser;
      let page;

      try {
        browser = await this.init();
        
        if (!browser.connected) {
          throw new Error('Browser is not connected');
        }

        page = await browser.newPage();
        
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);
        
        // Set viewport for better rendering
        await page.setViewport({ width: 1200, height: 800 });
        
        // Set content with better error handling
        await page.setContent(htmlContent, {
          waitUntil: 'domcontentloaded', // Changed from networkidle0 for better reliability
          timeout: 30000
        });

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready');
        
        // Additional wait for stability
        await page.waitForTimeout(1000);

        const pdfOptions = {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          },
          timeout: 30000,
          ...options
        };

        console.log('Generating PDF buffer...');
        const pdfBuffer = await page.pdf(pdfOptions);

        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('Generated PDF buffer is empty');
        }

        console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        
        // Validate PDF header
        if (pdfBuffer.length < 4 || pdfBuffer.toString('utf8', 0, 4) !== '%PDF') {
          throw new Error('Generated PDF has invalid format');
        }

        await page.close();
        return pdfBuffer;

      } catch (error) {
        console.error(`PDF generation attempt ${this.maxRetries - retries + 1} failed:`, error);
        
        if (page && !page.isClosed()) {
          try {
            await page.close();
          } catch (e) {
            console.error('Error closing page:', e);
          }
        }

        retries--;

        if (retries === 0) {
          console.error('All PDF generation attempts failed');
          throw new Error(`PDF generation failed after ${this.maxRetries} attempts: ${error.message}`);
        }

        // Wait before retry
        console.log(`Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Reset browser for retry
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            console.error('Error closing browser during retry:', e);
          }
          this.browser = null;
          this.browserPromise = null;
        }
      }
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('Browser closed successfully');
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
      this.browserPromise = null;
      this.isInitializing = false;
    }
  }

  async healthCheck() {
    try {
      const browser = await this.init();
      return browser.connected;
    } catch (error) {
      console.error('Browser health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const pdfGenerator = new PDFGenerator();

module.exports = pdfGenerator;