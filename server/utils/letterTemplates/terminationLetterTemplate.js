const terminationLetterTemplate = (data) => {
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
        .notice { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TERMINATION OF EMPLOYMENT</h1>
      </div>
      
      <div class="content">
        <p>Date: ${currentDate}</p>
        
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        
        <p>This letter serves as formal notification of the termination of your employment with our company, effective <strong>${new Date(data.effectiveDate).toLocaleDateString('en-IN')}</strong>.</p>
        
        <div class="notice">
          <p><strong>Reason for Termination:</strong></p>
          <p>${data.reason || 'As per company policy and based on recent discussions.'}</p>
        </div>
        
        <p>Your final settlement, including any outstanding salary, bonuses, or other dues, will be processed as per company policy and will be transferred to your registered bank account.</p>
        
        <p>Please complete the following before your last working day:</p>
        <ul>
          <li>Return all company property (laptop, ID card, access cards, etc.)</li>
          <li>Complete the exit formalities with the HR department</li>
          <li>Submit any pending work or documentation</li>
        </ul>
        
        <p>We thank you for your contributions during your tenure with us and wish you the best in your future endeavors.</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <p>Sincerely,</p>
          <br><br>
          <p><strong>HR Manager</strong></p>
          <p>Company Name</p>
        </div>
        
        <div style="margin-top: 30px;">
          <p>Acknowledged By:</p>
          <br><br>
          <p><strong>${data.candidateName}</strong></p>
          <p>Date: ________________</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = terminationLetterTemplate;