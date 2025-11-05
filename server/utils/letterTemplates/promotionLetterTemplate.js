// utils/letterTemplates/promotionLetterTemplate.js
const promotionLetterTemplate = (data) => {
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
        .congratulations { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PROMOTION LETTER</h1>
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
        
        <div class="congratulations">
          <p>We are pleased to inform you that you have been promoted to the position of <strong>${data.designation}</strong> at ${data.companyDetails?.name || 'our company'} effective from <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
        </div>
        
        <p>This promotion is in recognition of your exceptional performance, dedication, and valuable contributions to our organization.</p>
        
        <h3>New Position Details:</h3>
        <ul>
          <li><strong>New Designation:</strong> ${data.designation}</li>
          <li><strong>Department:</strong> ${data.department}</li>
          <li><strong>Effective Date:</strong> ${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</li>
        </ul>
        
        <h3>Revised Compensation:</h3>
        <ul>
          <li>Annual CTC: ₹${data.salary?.total?.toLocaleString('en-IN') || '0'}</li>
        </ul>
        
        <p>We are confident that you will continue to excel in your new role and contribute significantly to ${data.companyDetails?.name || 'the company'}'s growth and success.</p>
        
        <p>Please sign below to acknowledge receipt and acceptance of this promotion.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>Sincerely,</p>
          <br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
          <p>${data.companyDetails?.name || 'Company Name'}</p>
        </div>
        
        <div style="margin-top: 50px;">
          <p>Accepted By:</p>
          <br><br>
          <p><strong>${data.candidateName}</strong></p>
          <p>Date: ________________</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = promotionLetterTemplate;