// scripts/createDefaultTemplate.js
const mongoose = require('mongoose');
const OfferLetter = require('../models/OfferLetter');
require('dotenv').config();

const defaultTemplate = {
  name: "Standard Employment Offer Letter",
  description: "Professional offer letter template for full-time employees",
  template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Offer Letter - {{company_name}}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 25px;
            margin-bottom: 35px;
        }
        .company-name {
            color: #2c5aa0;
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .company-address {
            color: #666;
            font-size: 16px;
            margin: 8px 0;
        }
        .date {
            text-align: right;
            margin-bottom: 25px;
            color: #666;
            font-style: italic;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            color: #2c5aa0;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 8px;
            text-transform: uppercase;
        }
        .candidate-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-left: 5px solid #2c5aa0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .signature-section {
            margin-top: 80px;
        }
        .signature-line {
            border-top: 2px solid #333;
            width: 350px;
            margin-top: 100px;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 25px;
        }
        .highlight {
            background-color: #e3f2fd;
            padding: 6px 12px;
            font-weight: bold;
            border-radius: 6px;
            border: 1px solid #bbdefb;
        }
        .compensation-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: #fafafa;
        }
        .compensation-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
        }
        .compensation-table td:first-child {
            font-weight: bold;
            width: 40%;
            color: #2c5aa0;
        }
        .terms-list {
            list-style-type: none;
            padding: 0;
            background: #fafafa;
            border-radius: 8px;
            padding: 20px;
        }
        .terms-list li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        .terms-list li:last-child {
            border-bottom: none;
        }
        .terms-list strong {
            color: #2c5aa0;
        }
        .acceptance-section {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #c8e6c9;
            margin: 25px 0;
        }
        @media print {
            body {
                padding: 20px;
            }
            .header {
                border-bottom: 2px solid #2c5aa0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="company-name">{{company_name}}</h1>
        <p class="company-address">{{company_address}}</p>
        <p class="company-address">Email: {{company_email}} | Phone: {{company_contact}}</p>
    </div>

    <div class="date">
        Date: {{offer_date}}
    </div>

    <div class="candidate-info">
        <p style="font-size: 16px; margin: 0 0 10px 0;"><strong>{{candidate_name}}</strong></p>
        <p style="margin: 5px 0; font-size: 14px;">{{candidate_address}}</p>
        <p style="margin: 5px 0; font-size: 14px;">Email: {{email}} | Phone: {{phone}}</p>
    </div>

    <div class="section">
        <div class="section-title">OFFER OF EMPLOYMENT</div>
        <p>Dear <strong>{{candidate_name}}</strong>,</p>
        <p>We are delighted to offer you the position of <span class="highlight">{{designation}}</span> at {{company_name}}. This letter outlines the terms and conditions of your employment, and we are confident that you will make valuable contributions to our organization.</p>
    </div>

    <div class="section">
        <div class="section-title">1. POSITION DETAILS</div>
        <table class="compensation-table">
            <tr>
                <td>Designation:</td>
                <td>{{designation}}</td>
            </tr>
            <tr>
                <td>Department:</td>
                <td>{{department}}</td>
            </tr>
            <tr>
                <td>Employment Type:</td>
                <td>{{employment_type}}</td>
            </tr>
            <tr>
                <td>Reporting Manager:</td>
                <td>{{reporting_manager}}</td>
            </tr>
            <tr>
                <td>Work Location:</td>
                <td>{{work_location}}</td>
            </tr>
            <tr>
                <td>Date of Joining:</td>
                <td><strong>{{date_of_joining}}</strong></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. COMPENSATION PACKAGE</div>
        <table class="compensation-table">
            <tr>
                <td>Annual CTC:</td>
                <td>{{ctc}}</td>
            </tr>
            <tr>
                <td>Basic Salary:</td>
                <td>{{basic_salary}} per month</td>
            </tr>
            <tr>
                <td>Allowances:</td>
                <td>{{allowances}} per month</td>
            </tr>
            {{#if bonus}}
            <tr>
                <td>Bonus/Incentives:</td>
                <td>{{bonus}}</td>
            </tr>
            {{/if}}
            <tr>
                <td>Deductions:</td>
                <td>{{deductions}}</td>
            </tr>
            <tr>
                <td>Net Salary:</td>
                <td><strong>{{net_salary}} per month</strong> (after deductions)</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. TERMS & CONDITIONS</div>
        <ul class="terms-list">
            <li><strong>Working Hours:</strong> {{working_hours}}</li>
            <li><strong>Probation Period:</strong> {{probation_period}}</li>
            <li><strong>Notice Period:</strong> {{notice_period}}</li>
            <li><strong>Benefits & Perks:</strong> {{benefits}}</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">4. ACCEPTANCE OF OFFER</div>
        <div class="acceptance-section">
            <p>We are excited about the prospect of you joining our team and believe that your skills and experience will be valuable assets to our organization.</p>
            <p>Please sign and return this letter by <strong>{{offer_expiry_date}}</strong> to indicate your acceptance of this offer.</p>
            <p>We look forward to welcoming you to {{company_name}} and are confident that this will be the beginning of a long and mutually rewarding association.</p>
        </div>
    </div>

    <div class="signature-section">
        <p>Yours sincerely,</p>
        <br><br><br>
        <div class="signature-line"></div>
        <p style="margin-top: 10px;">
            <strong>{{hr_name}}</strong><br>
            {{hr_designation}}<br>
            {{company_name}}
        </p>
    </div>

    <div class="footer">
        <p><em>This is a computer-generated offer letter and does not require a physical signature.</em></p>
        <p>{{company_name}} | {{company_address}} | {{company_email}} | {{company_contact}}</p>
    </div>
</body>
</html>`
};

async function createDefaultTemplate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if template already exists
    const existingTemplate = await OfferLetter.findOne({ name: defaultTemplate.name });
    if (existingTemplate) {
      console.log('ℹ️  Default template already exists in database');
      console.log(`📄 Template ID: ${existingTemplate._id}`);
      return;
    }
    
    // Create default template
    const template = new OfferLetter({
      ...defaultTemplate,
      createdBy: new mongoose.Types.ObjectId() // Using a dummy ID for initial setup
    });
    
    await template.save();
    console.log('✅ Default template created successfully!');
    console.log(`📄 Template Name: ${template.name}`);
    console.log(`📝 Description: ${template.description}`);
    console.log(`🆔 Template ID: ${template._id}`);
    console.log(`📊 Variables detected: ${template.variables.length}`);
    console.log('🔧 Variables:', template.variables.join(', '));
    
  } catch (error) {
    console.error('❌ Error creating default template:', error);
    
    // More detailed error information
    if (error.name === 'MongoNetworkError') {
      console.log('💡 Tip: Make sure MongoDB is running on your system');
      console.log('💡 Run: mongod (or) sudo systemctl start mongod');
    }
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('💡 Tip: Check your MONGO_URI in .env file');
      console.log('💡 Current URI:', process.env.MONGO_URI);
    }
    
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createDefaultTemplate();
}

module.exports = createDefaultTemplate;