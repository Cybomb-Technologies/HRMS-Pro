// utils/letterTemplates/hikeLetterTemplate.js
const hikeLetterTemplate = (data) => {
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
        .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .salary-table th { background-color: #f5f5f5; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SALARY REVISION LETTER</h1>
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
        
        <p>We are pleased to inform you that based on your performance and contributions to ${data.companyDetails?.name || 'the company'}, your salary has been revised effective from <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
        
        <h3>Revised Salary Structure:</h3>
        <table class="salary-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>₹${(data.salary.basic || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td>₹${(data.salary.hra || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td>₹${(data.salary.specialAllowance || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td><strong>Total Annual CTC</strong></td>
              <td><strong>₹${(data.salary.total || 0).toLocaleString('en-IN')}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <p>This revision reflects our appreciation for your hard work and dedication. We look forward to your continued contributions to ${data.companyDetails?.name || 'the company'}'s success.</p>
        
        <p>Please sign below to acknowledge receipt and acceptance of this salary revision.</p>
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

module.exports = hikeLetterTemplate;