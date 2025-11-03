// utils/emailService.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendOfferLetterEmail = async (toEmail, candidateName, pdfBuffer, letterData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"HR Department" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Offer Letter - ${candidateName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Congratulations ${candidateName}!</h2>
          <p>We are pleased to extend an offer of employment for the position of <strong>${letterData.designation}</strong> at ${letterData.company_name}.</p>
          <p>Please find your official offer letter attached with this email.</p>
          <p><strong>Important Details:</strong></p>
          <ul>
            <li>Designation: ${letterData.designation}</li>
            <li>Department: ${letterData.department}</li>
            <li>Date of Joining: ${letterData.date_of_joining}</li>
            <li>Work Location: ${letterData.work_location}</li>
          </ul>
          <p>Please review the attached offer letter carefully and let us know if you have any questions.</p>
          <br>
          <p>Best regards,<br>HR Department<br>${letterData.company_name}</p>
        </div>
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
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOfferLetterEmail };