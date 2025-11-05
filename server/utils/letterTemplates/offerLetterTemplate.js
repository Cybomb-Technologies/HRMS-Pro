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
        .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .salary-table th { background-color: #f5f5f5; }
        .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #2c5aa0; margin: 15px 0; }
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
        
        <div class="highlight">
          <p>We are delighted to offer you the position of <strong>${data.designation}</strong> at ${data.companyDetails?.name || 'our company'}.</p>
        </div>
        
        <h3>Position Details:</h3>
        <ul>
          <li><strong>Designation:</strong> ${data.designation}</li>
          <li><strong>Department:</strong> ${data.department || 'To be assigned'}</li>
          <li><strong>Joining Date:</strong> ${new Date(data.joiningDate).toLocaleDateString('en-IN')}</li>
          ${data.workLocation ? `<li><strong>Work Location:</strong> ${data.workLocation}</li>` : ''}
          ${data.reportingManager ? `<li><strong>Reporting Manager:</strong> ${data.reportingManager}</li>` : ''}
        </ul>
        
        <h3>Compensation Package:</h3>
        <table class="salary-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Amount (₹ per annum)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>₹${formatSalary(data.salary?.basic)}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td>₹${formatSalary(data.salary?.hra)}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td>₹${formatSalary(data.salary?.specialAllowance)}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td><strong>Total Annual CTC</strong></td>
              <td><strong>₹${formatSalary(data.salary?.total)}</strong></td>
            </tr>
          </tbody>
        </table>

        <h3>Terms & Conditions:</h3>
        <ul>
          <li>This offer is subject to satisfactory background verification</li>
          <li>Your employment will be governed by the company's policies and procedures</li>
          <li>Standard probation period of 3 months applies</li>
          <li>Notice period of 30 days is required for resignation</li>
        </ul>
        
        <p>We believe your skills and experience will be valuable assets to our organization and look forward to welcoming you to our team.</p>
        
        <p>Please sign and return a copy of this letter to indicate your acceptance of this offer within 7 days.</p>
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
          <p>Signature: ________________</p>
          <p>Date: ________________</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = offerLetterTemplate;