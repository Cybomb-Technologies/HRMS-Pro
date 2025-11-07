// utils/letterTemplates/terminationLetterTemplate.js
const terminationLetterTemplate = (data) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Format company address
  const formatCompanyAddress = () => {
    const addr = data.companyDetails?.address;
    if (!addr) return 'Company Address Not Specified';
    
    const parts = [
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .content { margin: 30px 0; }
        .notice { background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
        .important { background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
        .procedure { background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TERMINATION OF EMPLOYMENT</h1>
        <div class="company-info">
          <h3>${data.companyDetails?.name || 'Company Name'}</h3>
          <p>${formatCompanyAddress()}</p>
          <div class="contact-info">
            ${data.companyDetails?.phone ? `<p>Phone: ${data.companyDetails.phone}</p>` : ''}
            ${data.companyDetails?.email ? `<p>Email: ${data.companyDetails.email}</p>` : ''}
          </div>
        </div>
      </div>
      
      <div class="content">
        <p>Date: ${currentDate}</p>
        
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        
        <div class="notice">
          <p>This letter serves as formal notification of the termination of your employment with ${data.companyDetails?.name || 'our company'}, effective <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
        </div>
        
        <div class="important">
          <p><strong>Reason for Termination:</strong></p>
          <p>${data.reason || 'As per company policy and based on recent discussions.'}</p>
        </div>

        ${data.lastWorkingDay ? `
        <p><strong>Last Working Day:</strong> ${new Date(data.lastWorkingDay).toLocaleDateString('en-IN')}</p>
        ` : ''}

        ${data.noticePeriod ? `
        <p><strong>Notice Period:</strong> ${data.noticePeriod}</p>
        ` : ''}

        <h3>Final Settlement:</h3>
        <p>Your final settlement will include:</p>
        <ul>
          <li>Outstanding salary up to your last working day</li>
          <li>Encashment of unused paid leaves (if applicable)</li>
          <li>Any other dues as per company policy</li>
          <li>Gratuity payment (as per eligibility)</li>
        </ul>
        
        <p>The final settlement amount will be processed and transferred to your registered bank account within 30 days of your last working date.</p>

        <div class="procedure">
          <h3>Exit Formalities:</h3>
          <p>Please complete the following procedures before your last working day:</p>
          <ol>
            <li><strong>Return Company Property:</strong> Laptop, ID card, access cards, keys, and any other company assets</li>
            <li><strong>Clear Dues:</strong> Settle any outstanding advances or dues with accounts department</li>
            <li><strong>Knowledge Transfer:</strong> Complete pending work documentation and handover</li>
            <li><strong>Exit Interview:</strong> Meet with HR department for exit formalities</li>
            <li><strong>System Access:</strong> Return all login credentials and access permissions</li>
          </ol>
        </div>

        <h3>Benefits & Insurance:</h3>
        <ul>
          <li>Your health insurance coverage will continue until the end of the current month</li>
          <li>You may convert your group health insurance to individual policy (if applicable)</li>
          <li>Provident Fund withdrawal process details will be shared separately</li>
        </ul>

        <p>We thank you for your contributions during your tenure with ${data.companyDetails?.name || 'our company'} and wish you the very best in your future endeavors.</p>
        
        <p>Should you have any questions regarding this termination or the settlement process, please contact the HR department.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>Sincerely,</p>
          <br><br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
          <p>Human Resources Department</p>
          <p>${data.companyDetails?.name || 'Company Name'}</p>
        </div>
        
        <div style="margin-top: 30px;">
          <p>Acknowledged By:</p>
          <br><br><br>
          <p><strong>${data.candidateName}</strong></p>
          <p>Signature: ________________</p>
          <p>Date: ________________</p>
        </div>

        <div style="margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          <p><strong>Note:</strong> This is an important legal document. Please keep it safe for future reference.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = terminationLetterTemplate;