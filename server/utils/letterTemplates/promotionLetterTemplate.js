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
        .congratulations { background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
        .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .salary-table th { background-color: #f5f5f5; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .comparison-table th, .comparison-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .comparison-table th { background-color: #e9ecef; }
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
          <h3 style="margin: 0; color: #155724;">🎉 Congratulations on Your Promotion! 🎉</h3>
          <p style="margin: 10px 0 0 0;">We are pleased to promote you to the position of <strong>${data.designation}</strong> effective from <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
        </div>
        
        ${data.promotionReason ? `
        <p><strong>Reason for Promotion:</strong> ${data.promotionReason}</p>
        ` : ''}

        <h3>Promotion Details:</h3>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th>Previous</th>
              <th>New</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Designation</strong></td>
              <td>${data.previousDesignation || 'Previous Position'}</td>
              <td><strong>${data.designation}</strong></td>
            </tr>
            <tr>
              <td><strong>Department</strong></td>
              <td>${data.department || 'Same'}</td>
              <td>${data.department || 'Same'}</td>
            </tr>
            <tr>
              <td><strong>Effective Date</strong></td>
              <td>-</td>
              <td>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <h3>Revised Compensation Structure:</h3>
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
              <td>₹${(data.salary?.basic || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td>₹${(data.salary?.hra || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td>₹${(data.salary?.specialAllowance || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #e8f5e8;">
              <td><strong>Total Annual CTC</strong></td>
              <td><strong>₹${(data.salary?.total || 0).toLocaleString('en-IN')}</strong></td>
            </tr>
          </tbody>
        </table>

        ${data.previousSalary ? `
        <h3>Previous Compensation (for reference):</h3>
        <table class="salary-table">
          <tbody>
            <tr>
              <td>Previous Total CTC</td>
              <td>₹${(data.previousSalary?.total || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        ` : ''}

        <h3>New Responsibilities:</h3>
        <p>With this promotion, you will be expected to take on additional responsibilities including:</p>
        ${data.responsibilities ? `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          ${data.responsibilities.split('\n').map(resp => `<p>• ${resp}</p>`).join('')}
        </div>
        ` : `
        <ul>
          <li>Enhanced leadership and strategic responsibilities</li>
          <li>Mentoring and guiding team members</li>
          <li>Driving departmental goals and objectives</li>
          <li>Participating in strategic planning sessions</li>
        </ul>
        `}

        <p>This promotion is a testament to your hard work, dedication, and valuable contributions to ${data.companyDetails?.name || 'our company'}. We are confident that you will continue to excel in your new role and contribute significantly to our organization's success.</p>

        <p>Please sign below to acknowledge receipt and acceptance of this promotion.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>Sincerely,</p>
          <br><br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'HR Manager'}</strong></p>
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

module.exports = promotionLetterTemplate;