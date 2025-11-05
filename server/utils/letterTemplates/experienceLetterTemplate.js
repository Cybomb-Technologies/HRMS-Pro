// utils/letterTemplates/experienceLetterTemplate.js
const experienceLetterTemplate = (data) => {
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
        .certificate { border: 2px solid #333; padding: 30px; margin: 20px 0; background-color: #f9f9f9; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>EXPERIENCE CERTIFICATE</h1>
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
        <div class="certificate">
          <p style="text-align: center; font-size: 18px; margin-bottom: 30px;">
            <strong>TO WHOMSOEVER IT MAY CONCERN</strong>
          </p>
          
          <p>This is to certify that <strong>${data.candidateName}</strong> was employed with ${data.companyDetails?.name || 'our organization'} from <strong>${new Date(data.joiningDate).toLocaleDateString('en-IN')}</strong> to <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
          
          <p>During ${data.duration || 'this period'}, ${data.candidateName} served as <strong>${data.designation}</strong> in the <strong>${data.department}</strong> department.</p>
          
          <p>${data.candidateName} has been a diligent and responsible employee during their tenure with us. ${data.candidateName} has shown dedication and commitment towards assigned responsibilities and has been a valuable member of our team.</p>
          
          <p>We wish ${data.candidateName} all the best in future endeavors.</p>
        </div>
        
        <p>This certificate is issued on ${data.candidateName}'s request without any liability on the part of the company.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>For ${data.companyDetails?.name || 'Company Name'},</p>
          <br><br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'Authorized Signatory'}</strong></p>
          <p>HR Department</p>
          <p>${data.companyDetails?.name || 'Company Name'}</p>
          <p>Date: ${currentDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = experienceLetterTemplate;