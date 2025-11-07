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
        .terms-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .terms-table th, .terms-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .terms-table th { background-color: #f5f5f5; }
        .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #2c5aa0; margin: 15px 0; }
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
            ${data.companyDetails?.website ? `<p>Website: ${data.companyDetails.website}</p>` : ''}
          </div>
        </div>
      </div>
      
      <div class="content">
        <p>Date: ${currentDate}</p>
        
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        
        <div class="highlight">
          <p>We are pleased to confirm your appointment as <strong>${data.designation}</strong> in the <strong>${data.department}</strong> department.</p>
        </div>
        
        <h3>Appointment Details:</h3>
        <table class="terms-table">
          <tbody>
            <tr>
              <td><strong>Designation</strong></td>
              <td>${data.designation}</td>
            </tr>
            <tr>
              <td><strong>Department</strong></td>
              <td>${data.department || 'Not specified'}</td>
            </tr>
            <tr>
              <td><strong>Joining Date</strong></td>
              <td>${new Date(data.joiningDate).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Work Location</strong></td>
              <td>${data.workLocation || 'Company Premises'}</td>
            </tr>
            ${data.reportingManager ? `
            <tr>
              <td><strong>Reporting Manager</strong></td>
              <td>${data.reportingManager}</td>
            </tr>
            ` : ''}
            <tr>
              <td><strong>Working Hours</strong></td>
              <td>9:00 AM to 6:00 PM (Monday to Friday)</td>
            </tr>
          </tbody>
        </table>

        <h3>Compensation & Benefits:</h3>
        <table class="terms-table">
          <tbody>
            <tr>
              <td><strong>Annual CTC</strong></td>
              <td>₹${(data.salary?.total || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Basic Salary</strong></td>
              <td>₹${(data.salary?.basic || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>HRA</strong></td>
              <td>₹${(data.salary?.hra || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td><strong>Special Allowance</strong></td>
              <td>₹${(data.salary?.specialAllowance || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <h3>Terms of Employment:</h3>
        <ul>
          <li><strong>Probation Period:</strong> 3 months from the date of joining</li>
          <li><strong>Notice Period:</strong> 30 days during probation, 60 days after confirmation</li>
          <li>Your appointment is subject to the company's rules and regulations</li>
          <li>You will be required to comply with all company policies and procedures</li>
          <li>The company reserves the right to modify terms and conditions as required</li>
        </ul>
        
        <p>We look forward to a long and mutually rewarding association with you and are confident that you will contribute significantly to our organization's growth.</p>
        
        <p>Please sign the duplicate copy of this letter as a token of your acceptance and return it to the HR Department.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>For ${data.companyDetails?.name || 'Company Name'},</p>
          <br><br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
          <p>Authorized Signatory</p>
        </div>
        
        <div style="margin-top: 30px;">
          <p>Accepted By:</p>
          <br><br><br>
          <p><strong>${data.candidateName}</strong></p>
          <p>Signature: ________________</p>
          <p>Date: ________________</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = appointmentLetterTemplate;