// utils/letterTemplates/offerLetterTemplate.js
const offerLetterTemplate = (data) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Safe salary formatting
  const formatSalary = (amount) => {
    if (!amount && amount !== 0) return '0';
    return amount.toLocaleString('en-IN');
  };

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
        .footer { margin-top: 50px; border-top: 1px solid #333; padding-top: 20px; }
        .signature { margin-top: 50px; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>OFFER OF EMPLOYMENT</h1>
        <div class="company-info">
          <h3>${data.companyDetails?.name || 'Company Name'}</h3>
          <p>${formatCompanyAddress()}</p>
          <div class="contact-info">
            ${data.companyDetails?.phone ? `<p>Phone: ${data.companyDetails.phone}</p>` : ''}
            ${data.companyDetails?.email ? `<p>Email: ${data.companyDetails.email}</p>` : ''}
            ${data.companyDetails?.website ? `<p>Website: ${data.companyDetails.website}</p>` : ''}
          </div>
        </div>
      </div>
      
      <div class="content">
        <p>Date: ${currentDate}</p>
        
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        
        <p>We are pleased to offer you the position of <strong>${data.designation}</strong> at ${data.companyDetails?.name || 'our company'}. This letter outlines the terms and conditions of your employment.</p>
        
        <h3>Position Details:</h3>
        <ul>
          <li><strong>Designation:</strong> ${data.designation}</li>
          <li><strong>Department:</strong> ${data.department}</li>
          <li><strong>Joining Date:</strong> ${new Date(data.joiningDate).toLocaleDateString('en-IN')}</li>
        </ul>
        
        <h3>Compensation Package:</h3>
        <ul>
          <li>Basic Salary: ₹${formatSalary(data.salary?.basic)}</li>
          <li>HRA: ₹${formatSalary(data.salary?.hra)}</li>
          <li>Special Allowance: ₹${formatSalary(data.salary?.specialAllowance)}</li>
          <li><strong>Total CTC:</strong> ₹${formatSalary(data.salary?.total)} per annum</li>
        </ul>
        
        <p>We believe your skills and experience will be valuable assets to our organization and look forward to welcoming you to our team.</p>
        
        <p>Please sign and return a copy of this letter to indicate your acceptance of this offer.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>Sincerely,</p>
          <br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
          <p>${data.companyDetails?.name || 'Company Name'}</p>
        </div>
        
        <div style="margin-top: 30px;">
          <p>Accepted and Agreed:</p>
          <br><br>
          <p><strong>${data.candidateName}</strong></p>
          <p>Date: ________________</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = offerLetterTemplate;