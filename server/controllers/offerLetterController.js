// controllers/offerLetterController.js
const OfferLetter = require('../models/OfferLetter');
const GeneratedLetter = require('../models/GeneratedLetter');
const { generatePDF } = require('../utils/pdfGenerator');
const { sendOfferLetterEmail } = require('../utils/emailService');
const mammoth = require('mammoth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/word-templates/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedExtensions = ['.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word documents (.doc, .docx) are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all offer letter templates
const getTemplates = async (req, res) => {
  try {
    const templates = await OfferLetter.find({ isActive: true, isTemplate: true })
      .select('name description templateType category variables preview originalFileName createdAt')
      .sort({ createdAt: -1 });
    
    // Add default templates if no templates exist
    if (templates.length === 0) {
      await createDefaultTemplates(req.user.id);
      const defaultTemplates = await OfferLetter.find({ isActive: true, isTemplate: true });
      return res.json(defaultTemplates);
    }
    
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create default templates
const createDefaultTemplates = async (userId) => {
  const defaultTemplates = [
    {
      name: 'Standard Full-Time Offer',
      description: 'Comprehensive offer letter for permanent employees',
      template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Offer Letter - {{company_name}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; }
        .section { margin: 25px 0; }
        .signature-section { margin-top: 60px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{company_name}}</h1>
        <p>{{company_address}}</p>
    </div>
    
    <div class="date">Date: {{offer_date}}</div>
    
    <div class="section">
        <p>Dear <strong>{{candidate_name}}</strong>,</p>
        <p>We are pleased to offer you the position of <strong>{{designation}}</strong> at {{company_name}}.</p>
    </div>
    
    <div class="section">
        <h3>Employment Details:</h3>
        <p><strong>Designation:</strong> {{designation}}</p>
        <p><strong>Department:</strong> {{department}}</p>
        <p><strong>Date of Joining:</strong> {{date_of_joining}}</p>
        <p><strong>Work Location:</strong> {{work_location}}</p>
    </div>
    
    <div class="section">
        <h3>Compensation:</h3>
        <p><strong>Annual CTC:</strong> {{ctc}}</p>
        <p><strong>Basic Salary:</strong> {{basic_salary}}</p>
        <p><strong>Net Salary:</strong> {{net_salary}}</p>
    </div>
    
    <div class="signature-section">
        <p>Sincerely,</p>
        <p><strong>{{hr_name}}</strong></p>
        <p>{{hr_designation}}</p>
        <p>{{company_name}}</p>
    </div>
</body>
</html>`,
      category: 'Full-Time',
      preview: 'Professional template with all standard employment sections',
      templateType: 'default',
      createdBy: userId
    },
    {
      name: 'Executive Level Offer',
      description: 'Premium offer letter for senior management positions',
      template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Executive Offer - {{company_name}}</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.8; margin: 50px; }
        .header { border-bottom: 3px double #000; padding-bottom: 30px; }
        .executive-section { background: #f8f9fa; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>EXECUTIVE OFFER LETTER</h1>
        <h2>{{company_name}}</h2>
    </div>
    
    <p>Dear <strong>{{candidate_name}}</strong>,</p>
    
    <div class="executive-section">
        <h3>Executive Position: {{designation}}</h3>
        <p><strong>Package:</strong> {{ctc}} + Executive Benefits</p>
        <p><strong>Reporting To:</strong> {{reporting_manager}}</p>
        <p><strong>Start Date:</strong> {{date_of_joining}}</p>
    </div>
    
    <p>We look forward to your leadership at {{company_name}}.</p>
    
    <div class="signature-section">
        <p>For {{company_name}},</p>
        <br><br>
        <p><strong>{{hr_name}}</strong></p>
        <p>{{hr_designation}}</p>
    </div>
</body>
</html>`,
      category: 'Executive',
      preview: 'Enhanced template for executive roles with premium formatting',
      templateType: 'default',
      createdBy: userId
    },
    {
      name: 'Internship Program',
      description: 'Offer letter for internship positions',
      template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Internship Offer - {{company_name}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .internship-info { background: #e8f4fd; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>INTERNSHIP OFFER LETTER</h2>
        <p>{{company_name}}</p>
    </div>
    
    <p>Dear <strong>{{candidate_name}}</strong>,</p>
    
    <div class="internship-info">
        <p>We are pleased to offer you an internship position as <strong>{{designation}}</strong>.</p>
        <p><strong>Duration:</strong> {{probation_period}}</p>
        <p><strong>Stipend:</strong> {{ctc}}</p>
        <p><strong>Start Date:</strong> {{date_of_joining}}</p>
    </div>
    
    <p>This internship will provide valuable learning experience in {{department}}.</p>
    
    <div class="signature-section">
        <p>Welcome to {{company_name}}!</p>
        <br><br>
        <p><strong>{{hr_name}}</strong></p>
        <p>{{hr_designation}}</p>
    </div>
</body>
</html>`,
      category: 'Internship',
      preview: 'Structured template for internship programs',
      templateType: 'default',
      createdBy: userId
    }
  ];

  await OfferLetter.insertMany(defaultTemplates);
};

// Upload Word document as template
const uploadWordTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { name, description, category } = req.body;
    
    if (!name) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Template name is required' });
    }

    // Convert Word to HTML
    const result = await mammoth.convertToHtml({ path: req.file.path });
    const htmlContent = result.value;

    // Extract variables from the HTML content
    const variableRegex = /{{(\w+)}}/g;
    const matches = htmlContent.match(variableRegex);
    const variables = matches ? [...new Set(matches.map(match => match.replace(/{{|}}/g, '')))] : [];

    // Create new template
    const newTemplate = new OfferLetter({
      name,
      description: description || '',
      template: htmlContent,
      templateType: 'word_upload',
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      variables,
      category: category || 'Custom',
      preview: `Custom template uploaded from ${req.file.originalname}`,
      createdBy: req.user.id
    });

    await newTemplate.save();

    res.status(201).json({
      message: 'Word template uploaded successfully',
      template: {
        _id: newTemplate._id,
        name: newTemplate.name,
        description: newTemplate.description,
        templateType: newTemplate.templateType,
        category: newTemplate.category,
        variables: newTemplate.variables,
        originalFileName: newTemplate.originalFileName
      }
    });

  } catch (error) {
    console.error('Upload Word template error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Error processing Word document: ' + error.message });
  }
};

// Get single template
const getTemplate = async (req, res) => {
  try {
    const template = await OfferLetter.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new template (manual HTML)
const createTemplate = async (req, res) => {
  try {
    const { name, description, template, category } = req.body;
    
    if (!name || !template) {
      return res.status(400).json({ message: 'Name and template content are required' });
    }
    
    const newTemplate = new OfferLetter({
      name,
      description: description || '',
      template,
      templateType: 'default',
      category: category || 'General',
      createdBy: req.user.id
    });

    // Extract variables
    newTemplate.variables = newTemplate.extractVariables();
    
    await newTemplate.save();
    
    res.status(201).json({
      message: 'Template created successfully',
      template: newTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate offer letter
const generateOfferLetter = async (req, res) => {
  try {
    const template = await OfferLetter.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const data = req.body;
    let generatedLetter = template.template;
    
    // Replace all placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] || '';
      generatedLetter = generatedLetter.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Clean up any unreplaced placeholders
    generatedLetter = generatedLetter.replace(/{{(\w+)}}/g, '');
    
    // Save generated letter to database
    const savedLetter = new GeneratedLetter({
      templateId: template._id,
      templateName: template.name,
      templateType: template.templateType,
      candidateName: data.candidate_name,
      candidateEmail: data.email,
      designation: data.designation,
      htmlContent: generatedLetter,
      formData: data,
      generatedBy: req.user.id,
      status: 'draft'
    });
    
    await savedLetter.save();
    
    res.json({
      html: generatedLetter,
      templateName: template.name,
      generatedLetterId: savedLetter._id,
      message: 'Offer letter generated and saved successfully'
    });
    
  } catch (error) {
    console.error('Generate offer letter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { name, description, template, isActive, category } = req.body;
    
    const updatedTemplate = await OfferLetter.findByIdAndUpdate(
      req.params.id,
      { name, description, template, isActive, category },
      { new: true, runValidators: true }
    );
    
    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const template = await OfferLetter.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Delete uploaded file if it exists
    if (template.templateType === 'word_upload' && template.filePath && fs.existsSync(template.filePath)) {
      fs.unlinkSync(template.filePath);
    }
    
    await OfferLetter.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all generated letters
const getGeneratedLetters = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const letters = await GeneratedLetter.find(query)
      .populate('templateId', 'name description templateType')
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await GeneratedLetter.countDocuments(query);
    
    res.json({
      letters,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get generated letters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single generated letter
const getGeneratedLetter = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findById(req.params.id)
      .populate('templateId', 'name template variables templateType')
      .populate('generatedBy', 'name email');
    
    if (!letter) {
      return res.status(404).json({ message: 'Generated letter not found' });
    }
    
    res.json(letter);
  } catch (error) {
    console.error('Get generated letter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update generated letter
const updateGeneratedLetter = async (req, res) => {
  try {
    const { formData, status, htmlContent } = req.body;
    
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Generated letter not found' });
    }
    
    if (formData) {
      letter.candidateName = formData.candidate_name || letter.candidateName;
      letter.candidateEmail = formData.email || letter.candidateEmail;
      letter.designation = formData.designation || letter.designation;
      letter.formData = { ...letter.formData, ...formData };
      
      const template = await OfferLetter.findById(letter.templateId);
      if (template) {
        let generatedLetter = template.template;
        
        Object.keys(letter.formData).forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = letter.formData[key] || '';
          generatedLetter = generatedLetter.replace(new RegExp(placeholder, 'g'), value);
        });
        
        generatedLetter = generatedLetter.replace(/{{(\w+)}}/g, '');
        letter.htmlContent = generatedLetter;
      } else if (htmlContent) {
        letter.htmlContent = htmlContent;
      }
    } else if (htmlContent) {
      letter.htmlContent = htmlContent;
    }
    
    if (status) {
      letter.status = status;
      if (status === 'sent') {
        letter.sentAt = new Date();
      } else if (status === 'accepted') {
        letter.acceptedAt = new Date();
      }
    }
    
    letter.updatedAt = new Date();
    await letter.save();
    
    const updatedLetter = await GeneratedLetter.findById(letter._id)
      .populate('templateId', 'name description')
      .populate('generatedBy', 'name email');
    
    res.json({
      message: 'Generated letter updated successfully',
      letter: updatedLetter
    });
  } catch (error) {
    console.error('Update generated letter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete generated letter
const deleteGeneratedLetter = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findByIdAndDelete(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Generated letter not found' });
    }
    
    res.json({ message: 'Generated letter deleted successfully' });
  } catch (error) {
    console.error('Delete generated letter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download PDF
const downloadPDF = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Generated letter not found' });
    }
    
    const pdfBuffer = await generatePDF(letter.htmlContent);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offer-letter-${letter.candidateName.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

// Send offer letter via email
const sendOfferLetter = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Generated letter not found' });
    }
    
    if (!letter.candidateEmail) {
      return res.status(400).json({ message: 'Candidate email is required' });
    }
    
    const pdfBuffer = await generatePDF(letter.htmlContent);
    
    const emailResult = await sendOfferLetterEmail(
      letter.candidateEmail,
      letter.candidateName,
      pdfBuffer,
      letter.formData
    );
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send email: ' + emailResult.error });
    }
    
    letter.status = 'sent';
    letter.sentAt = new Date();
    letter.sentTo = letter.candidateEmail;
    await letter.save();
    
    res.json({
      message: 'Offer letter sent successfully',
      emailId: emailResult.messageId
    });
  } catch (error) {
    console.error('Send offer letter error:', error);
    res.status(500).json({ message: 'Error sending offer letter' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  uploadWordTemplate,
  generateOfferLetter,
  updateTemplate,
  deleteTemplate,
  getGeneratedLetters,
  getGeneratedLetter,
  updateGeneratedLetter,
  deleteGeneratedLetter,
  downloadPDF,
  sendOfferLetter,
  upload
};