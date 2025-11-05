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

  // Calculate hike percentage if not provided
  const calculateHikePercentage = () => {
    if (data.hikePercentage) return data.hikePercentage;
    
    if (data.previousSalary?.total && data.salary?.total) {
      const previous = data.previousSalary.total;
      const current = data.salary.total;
      const hike = ((current - previous) / previous) * 100;
      return Math.round(hike * 100) / 100; // Round to 2 decimal places
    }
    return 0;
  };

  const hikePercentage = calculateHikePercentage();

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
        .salary-table th { background-color: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }
        .signature { margin-top: 50px; }
        .highlight { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .comparison-table th, .comparison-table td { border: 1px solid #ddd; padding: 10px; text-align: center; }
        .comparison-table th { background-color: #e9ecef; }
        .increase { color: #28a745; font-weight: bold; }
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
        
        <div class="highlight">
          <h3 style="margin: 0; color: #155724;">Salary Revision Approved</h3>
          <p style="margin: 10px 0 0 0;">Effective from: <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong></p>
          ${hikePercentage > 0 ? `<p style="margin: 5px 0 0 0; font-size: 18px;"><strong>Salary Increase: ${hikePercentage}%</strong></p>` : ''}
        </div>
        
        <p>We are pleased to inform you that based on your exceptional performance, dedication, and valuable contributions to ${data.companyDetails?.name || 'our company'}, your salary has been revised.</p>

        <h3>Revised Salary Structure:</h3>
        <table class="salary-table">
          <thead>
            <tr>
              <th>Salary Component</th>
              <th>Amount (₹ per annum)</th>
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
            <tr style="background-color: #f0f8f0;">
              <td><strong>Total Annual CTC</strong></td>
              <td><strong>₹${(data.salary.total || 0).toLocaleString('en-IN')}</strong></td>
            </tr>
          </tbody>
        </table>

        ${data.previousSalary ? `
        <h3>Salary Comparison:</h3>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Previous (₹)</th>
              <th>Revised (₹)</th>
              <th>Increase (₹)</th>
              <th>Increase (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>${(data.previousSalary.basic || 0).toLocaleString('en-IN')}</td>
              <td>${(data.salary.basic || 0).toLocaleString('en-IN')}</td>
              <td class="increase">+${((data.salary.basic || 0) - (data.previousSalary.basic || 0)).toLocaleString('en-IN')}</td>
              <td class="increase">${data.previousSalary.basic ? (((data.salary.basic - data.previousSalary.basic) / data.previousSalary.basic) * 100).toFixed(1) : '0'}%</td>
            </tr>
            <tr>
              <td>Total CTC</td>
              <td>${(data.previousSalary.total || 0).toLocaleString('en-IN')}</td>
              <td><strong>${(data.salary.total || 0).toLocaleString('en-IN')}</strong></td>
              <td class="increase"><strong>+${((data.salary.total || 0) - (data.previousSalary.total || 0)).toLocaleString('en-IN')}</strong></td>
              <td class="increase"><strong>${hikePercentage}%</strong></td>
            </tr>
          </tbody>
        </table>
        ` : ''}

        <h3>Additional Information:</h3>
        <ul>
          <li><strong>Effective Date:</strong> ${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</li>
          <li><strong>Payment Cycle:</strong> The revised salary will be reflected in the next payroll cycle</li>
          <li><strong>Tax Implications:</strong> Please consult with your tax advisor regarding any tax implications</li>
          <li><strong>Confidentiality:</strong> This salary information is confidential and should not be disclosed</li>
        </ul>

        <p>This revision reflects our appreciation for your hard work and commitment to excellence. We are confident that you will continue to contribute significantly to our organization's success.</p>
        
        <p>Congratulations on this achievement! We look forward to your continued growth and success with ${data.companyDetails?.name || 'our company'}.</p>
        
        <p>Please sign below to acknowledge receipt and acceptance of this salary revision.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>Sincerely,</p>
          <br><br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
          <p>Human Resources Department</p>
          <p>${data.companyDetails?.name || 'Company Name'}</p>
        </div>
        
        <div style="margin-top: 50px;">
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

module.exports = hikeLetterTemplate;