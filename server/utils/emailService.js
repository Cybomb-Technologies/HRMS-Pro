const nodemailer = require('nodemailer');

// Configure email transporter with better error handling
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email functionality will be limited.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

const sendOfferLetterEmail = async (toEmail, candidateName, pdfBuffer, formData, trackingId) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter not available. Skipping email send.');
      return {
        success: true, // Mark as success for development
        messageId: 'local-development-' + Date.now(),
        warning: 'Email not sent - SMTP not configured'
      };
    }
    
    const companyName = formData.company_name || 'Cybomb Technologies LLP';
    const designation = formData.designation || 'Not specified';
    const joiningDate = formData.date_of_joining || 'To be confirmed';
    const workLocation = formData.work_location || 'Chennai';
    
    const mailOptions = {
      from: `"HR Department - ${companyName}" <${process.env.SMTP_USER || 'noreply@company.com'}>`,
      to: toEmail,
      subject: `Offer Letter - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #2c5aa0; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${companyName}</h1>
                    <h2>Offer of Employment</h2>
                </div>
                
                <div class="content">
                    <p>Dear <strong>${candidateName}</strong>,</p>
                    
                    <p>Congratulations! We are pleased to extend an offer of employment for the position of <strong>${designation}</strong> at ${companyName}.</p>
                    
                    <div class="highlight">
                        <p><strong>Key Details:</strong></p>
                        <ul>
                            <li><strong>Position:</strong> ${designation}</li>
                            <li><strong>Work Location:</strong> ${workLocation}</li>
                            <li><strong>Expected Joining:</strong> ${joiningDate}</li>
                        </ul>
                    </div>
                    
                    <p>Please find your official offer letter attached with this email. This document contains comprehensive details about your compensation, benefits, and terms of employment.</p>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Review the attached offer letter carefully</li>
                        <li>Sign the document where indicated</li>
                        <li>Return the signed copy to HR within 7 days</li>
                        <li>Contact HR if you have any questions</li>
                    </ol>
                    
                    <p>We are excited about the prospect of you joining our team and look forward to your positive response.</p>
                    
                    <p>Best regards,<br>
                    <strong>HR Department</strong><br>
                    ${companyName}</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>Tracking ID: ${trackingId}</p>
                </div>
            </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `offer-letter-${candidateName.replace(/\s+/g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Offer letter email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendOfferLetterEmail
};