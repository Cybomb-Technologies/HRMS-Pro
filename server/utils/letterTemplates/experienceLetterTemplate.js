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

  // Calculate employment duration
  const calculateDuration = () => {
    if (data.joiningDate && data.effectiveDate) {
      const start = new Date(data.joiningDate);
      const end = new Date(data.effectiveDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const days = diffDays % 30;
      
      let duration = '';
      if (years > 0) duration += `${years} year${years > 1 ? 's' : ''} `;
      if (months > 0) duration += `${months} month${months > 1 ? 's' : ''} `;
      if (days > 0 && years === 0) duration += `${days} day${days > 1 ? 's' : ''}`;
      
      return duration.trim();
    }
    return data.duration || 'Not specified';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .content { margin: 30px 0; }
        .certificate { border: 2px solid #333; padding: 40px; margin: 20px 0; background-color: #f9f9f9; text-align: justify; }
        .company-info { margin-bottom: 20px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
        .duration { text-align: center; font-weight: bold; margin: 20px 0; }
        .responsibilities { margin: 20px 0; }
        .footer { margin-top: 50px; text-align: center; }
        .signature { margin-top: 80px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>EXPERIENCE CERTIFICATE</h1>
        <div class="company-info">
          <h2>${data.companyDetails?.name || 'Company Name'}</h2>
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
          
          <p>This is to certify that <strong>Mr./Ms. ${data.candidateName}</strong> was employed with ${data.companyDetails?.name || 'our organization'} from <strong>${new Date(data.joiningDate).toLocaleDateString('en-IN')}</strong> to <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
          
          <div class="duration">
            <p>Employment Duration: ${calculateDuration()}</p>
          </div>
          
          <p>During ${data.duration || 'this period'}, ${data.candidateName} served as <strong>${data.designation}</strong> in the <strong>${data.department}</strong> department.</p>
          
          ${data.responsibilities ? `
          <div class="responsibilities">
            <p><strong>Key Responsibilities:</strong></p>
            <p>${data.responsibilities}</p>
          </div>
          ` : `
          <p>During ${data.candidateName}'s tenure, ${data.candidateName} was responsible for various duties related to ${data.department || 'their department'} and performed all assigned tasks with dedication and professionalism.</p>
          `}
          
          ${data.achievements ? `
          <div class="responsibilities">
            <p><strong>Notable Achievements:</strong></p>
            <p>${data.achievements}</p>
          </div>
          ` : ''}
          
          <p>Throughout ${data.candidateName}'s employment, ${data.candidateName} demonstrated:</p>
          <ul>
            <li>Strong professional ethics and integrity</li>
            <li>Excellent teamwork and collaboration skills</li>
            <li>Dedication and commitment to organizational goals</li>
            <li>Professional competence in assigned responsibilities</li>
          </ul>
          
          <p>${data.candidateName} has been a diligent, responsible, and valuable member of our team. ${data.candidateName}'s performance was consistently satisfactory, and ${data.candidateName} maintained good professional relationships with colleagues and supervisors.</p>
          
          <p>${data.candidateName} left the company on their own volition to pursue better opportunities, and we respect ${data.candidateName}'s decision. The management wishes ${data.candidateName} all the success in future endeavors.</p>
          
          <p>This certificate is issued on ${data.candidateName}'s request without any liability on the part of the undersigned or the company.</p>
        </div>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>For ${data.companyDetails?.name || 'Company Name'},</p>
          <br><br><br>
          <p><strong>${data.companyDetails?.hrManagerName || 'Authorized Signatory'}</strong></p>
          <p>Human Resources Department</p>
          <p>${data.companyDetails?.name || 'Company Name'}</p>
          <br>
          <p><strong>Date:</strong> ${currentDate}</p>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          <p><strong>Verification Note:</strong> This certificate can be verified by contacting the HR Department at ${data.companyDetails?.email || 'HR email'} or ${data.companyDetails?.phone || 'HR phone number'}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = experienceLetterTemplate;