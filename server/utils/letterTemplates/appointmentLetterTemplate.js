const appointmentLetterTemplate = (data) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .content { margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>APPOINTMENT LETTER</h1>
      </div>
      
      <div class="content">
        <p>Date: ${currentDate}</p>
        
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        
        <p>We are pleased to confirm your appointment as <strong>${data.designation}</strong> in the <strong>${data.department}</strong> department of our organization, effective from <strong>${new Date(data.joiningDate).toLocaleDateString('en-IN')}</strong>.</p>
        
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
          <p>For Company Name,</p>
          <br><br>
          <p><strong>HR Manager</strong></p>
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