// utils/letterTemplates/appointmentLetterTemplate.js
const appointmentLetterTemplate = (data) => {
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
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>APPOINTMENT LETTER</h1>
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
        
        <p>We are pleased to confirm your appointment as <strong>${data.designation}</strong> in the <strong>${data.department}</strong> department of ${data.companyDetails?.name || 'our organization'}, effective from <strong>${new Date(data.joiningDate).toLocaleDateString('en-IN')}</strong>.</p>
        
        <h3>Terms of Appointment:</h3>
        <ul>
          <li><strong>Designation:</strong> ${data.designation}</li>
          <li><strong>Department:</strong> ${data.department}</li>
          <li><strong>Work Location:</strong> Company Premises</li>
          <li><strong>Working Hours:</strong> 9:00 AM to 6:00 PM (Monday to Friday)</li>
        </ul>
        
        <h3>Compensation Package:</h3>
        <ul>
          <li>Annual CTC: ₹${(data.salary.total || 0).toLocaleString('en-IN')}</li>
          <li>Probation Period: 3 months</li>
          <li>Notice Period: 30 days</li>
        </ul>
        
        <p>Your appointment is subject to the company's rules and regulations as amended from time to time.</p>
        
        <p>We look forward to a long and mutually rewarding association with you.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>For ${data.companyDetails?.name || 'Company Name'},</p>
          <br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
        </div>
        
        <div style="margin-top: 30px;">
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

module.exports = appointmentLetterTemplate;