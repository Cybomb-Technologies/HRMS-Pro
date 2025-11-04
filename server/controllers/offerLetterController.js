const OfferLetter = require('../models/OfferLetter');
const GeneratedLetter = require('../models/GeneratedLetter');
const { generatePDF } = require('../utils/pdfGenerator');
const { sendOfferLetterEmail } = require('../utils/emailService');
const mammoth = require('mammoth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads with better error handling
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

// Enhanced error handling for file upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum 10MB allowed.' });
    }
    return res.status(400).json({ message: `Upload error: ${error.message}` });
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
};

// Enhanced default templates
const createDefaultTemplates = async (userId) => {
  const defaultTemplates = [
    {
      name: 'Standard Employment Offer',
      description: 'Professional full-time employment offer with comprehensive details',
      template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Employment Offer - {{company_name}}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 40px; 
            color: #333;
            background: #ffffff;
        }
        .letter-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e0e0e0;
            padding: 50px;
            background: #ffffff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #2c5aa0; 
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
        }
        .section { 
            margin: 30px 0; 
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .signature-section { 
            margin-top: 80px; 
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 300px;
            margin: 40px 0 10px 0;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
        }
        .highlight {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #2c5aa0;
            margin: 15px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table td {
            padding: 10px;
            border-bottom: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="letter-container">
        <div class="header">
            <div class="company-name">{{company_name}}</div>
            <div class="company-address">{{company_address}}</div>
            <div style="margin-top: 10px;">
                <strong>OFFER OF EMPLOYMENT</strong>
            </div>
        </div>
        
        <div style="text-align: right; margin-bottom: 30px;">
            <strong>Date:</strong> {{offer_date}}
        </div>
        
        <div class="section">
            <p>Dear <strong>{{candidate_name}}</strong>,</p>
            <p>We are delighted to extend an offer of employment for the position of <strong>{{designation}}</strong> at {{company_name}}. We were impressed with your qualifications and believe you will be a valuable addition to our team.</p>
        </div>
        
        <div class="section">
            <div class="section-title">POSITION DETAILS</div>
            <table>
                <tr><td style="width: 40%;"><strong>Designation:</strong></td><td>{{designation}}</td></tr>
                <tr><td><strong>Department:</strong></td><td>{{department}}</td></tr>
                <tr><td><strong>Employment Type:</strong></td><td>{{employment_type}}</td></tr>
                <tr><td><strong>Reporting Manager:</strong></td><td>{{reporting_manager}}</td></tr>
                <tr><td><strong>Work Location:</strong></td><td>{{work_location}}</td></tr>
                <tr><td><strong>Date of Joining:</strong></td><td><strong>{{date_of_joining}}</strong></td></tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">COMPENSATION & BENEFITS</div>
            <div class="highlight">
                <table>
                    <tr><td style="width: 40%;"><strong>Annual CTC:</strong></td><td>{{ctc}}</td></tr>
                    <tr><td><strong>Basic Salary:</strong></td><td>{{basic_salary}}</td></tr>
                    <tr><td><strong>Allowances:</strong></td><td>{{allowances}}</td></tr>
                    <tr><td><strong>Net Monthly Salary:</strong></td><td><strong>{{net_salary}}</strong></td></tr>
                </table>
            </div>
            <p><strong>Benefits:</strong> {{benefits}}</p>
        </div>

        <div class="section">
            <div class="section-title">TERMS & CONDITIONS</div>
            <table>
                <tr><td style="width: 40%;"><strong>Probation Period:</strong></td><td>{{probation_period}}</td></tr>
                <tr><td><strong>Notice Period:</strong></td><td>{{notice_period}}</td></tr>
                <tr><td><strong>Working Hours:</strong></td><td>{{working_hours}}</td></tr>
            </table>
        </div>

        <div class="section">
            <p>This offer is contingent upon satisfactory reference checks and background verification. Please sign and return this letter by <strong>{{offer_expiry_date}}</strong> to indicate your acceptance.</p>
        </div>
        
        <div class="signature-section">
            <div style="display: flex; justify-content: space-between;">
                <div style="width: 45%;">
                    <p><strong>For {{company_name}}:</strong></p>
                    <div class="signature-line"></div>
                    <p><strong>{{hr_name}}</strong><br>
                    {{hr_designation}}<br>
                    {{company_name}}</p>
                    <p>Date: ___________</p>
                </div>
                
                <div style="width: 45%;">
                    <p><strong>Accepted by Candidate:</strong></p>
                    <div class="signature-line"></div>
                    <p><strong>{{candidate_name}}</strong><br>
                    Candidate<br>
                    Date: ___________</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Confidential & Proprietary - {{company_name}} | {{company_address}} | {{company_email}} | {{company_contact}}</p>
        </div>
    </div>
</body>
</html>`,
      category: 'Full-Time',
      preview: 'Professional employment offer with comprehensive details and modern design',
      templateType: 'professional',
      icon: '👔',
      color: 'blue',
      createdBy: userId
    }
  ];

  try {
    await OfferLetter.insertMany(defaultTemplates);
    console.log('Default templates created successfully');
  } catch (error) {
    console.error('Error creating default templates:', error);
  }
};

// Get all offer letter templates
const getTemplates = async (req, res) => {
  try {
    let templates = await OfferLetter.find({ isActive: true, isTemplate: true })
      .select('name description templateType category variables preview icon color createdAt')
      .sort({ createdAt: -1 });
    
    // Add default templates if no templates exist
    if (templates.length === 0) {
      await createDefaultTemplates(req.user.id);
      templates = await OfferLetter.find({ isActive: true, isTemplate: true });
    }
    
    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch templates',
      error: error.message 
    });
  }
};

// Get single template
const getTemplate = async (req, res) => {
  try {
    const template = await OfferLetter.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template not found' 
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch template',
      error: error.message 
    });
  }
};

// Create template
const createTemplate = async (req, res) => {
  try {
    const { name, description, template, category, variables } = req.body;
    
    if (!name || !template) {
      return res.status(400).json({
        success: false,
        message: 'Name and template content are required'
      });
    }
    
    const newTemplate = new OfferLetter({
      name,
      description,
      template,
      category,
      variables,
      createdBy: req.user.id,
      isTemplate: true,
      isActive: true
    });
    
    await newTemplate.save();
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: newTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create template',
      error: error.message 
    });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { name, description, template, category, variables } = req.body;
    
    const updatedTemplate = await OfferLetter.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        template,
        category,
        variables,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedTemplate) {
      return res.status(404).json({ 
        success: false,
        message: 'Template not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update template',
      error: error.message 
    });
  }
};

// Delete template (soft delete)
const deleteTemplate = async (req, res) => {
  try {
    const template = await OfferLetter.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Template deleted successfully' 
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete template',
      error: error.message 
    });
  }
};

// Upload Word document as template
const uploadWordTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const { name, description, category } = req.body;
    
    if (!name) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false,
        message: 'Template name is required' 
      });
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
      description: description || `Custom template from ${req.file.originalname}`,
      template: htmlContent,
      templateType: 'word_upload',
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      variables,
      category: category || 'Custom',
      preview: `Custom template uploaded from ${req.file.originalname}`,
      icon: '📄',
      color: 'green',
      createdBy: req.user.id,
      isTemplate: true,
      isActive: true
    });

    await newTemplate.save();

    res.status(201).json({
      success: true,
      message: 'Word template uploaded successfully',
      data: {
        _id: newTemplate._id,
        name: newTemplate.name,
        description: newTemplate.description,
        templateType: newTemplate.templateType,
        category: newTemplate.category,
        variables: newTemplate.variables,
        originalFileName: newTemplate.originalFileName,
        icon: newTemplate.icon,
        color: newTemplate.color
      }
    });

  } catch (error) {
    console.error('Upload Word template error:', error);
    
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error processing Word document',
      error: error.message 
    });
  }
};

// Generate offer letter
const generateOfferLetter = async (req, res) => {
  try {
    const template = await OfferLetter.findById(req.params.templateId);
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        message: 'Template not found' 
      });
    }
    
    const data = req.body;
    let generatedLetter = template.template;
    
    // Enhanced placeholder replacement with fallbacks
    const allVariables = template.variables || [];
    allVariables.forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] || getDefaultValue(key) || '';
      generatedLetter = generatedLetter.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Clean up any unreplaced placeholders
    generatedLetter = generatedLetter.replace(/{{(\w+)}}/g, '');
    
    // Save generated letter to database
    const savedLetter = new GeneratedLetter({
      templateId: template._id,
      templateName: template.name,
      templateType: template.templateType,
      candidateName: data.candidate_name || data.contractor_name || 'Candidate',
      candidateEmail: data.email,
      designation: data.designation || data.title || 'Not specified',
      htmlContent: generatedLetter,
      formData: data,
      generatedBy: req.user.id,
      status: 'draft'
    });
    
    await savedLetter.save();
    
    res.json({
      success: true,
      message: 'Offer letter generated and saved successfully',
      data: {
        html: generatedLetter,
        templateName: template.name,
        generatedLetterId: savedLetter._id,
        trackingId: savedLetter.trackingId
      }
    });
    
  } catch (error) {
    console.error('Generate offer letter error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate offer letter',
      error: error.message 
    });
  }
};

// Helper function for default values
const getDefaultValue = (key) => {
  const defaults = {
    'company_name': 'Cybomb Technologies LLP',
    'company_address': 'Prime Plaza, Chennai, Tamil Nadu - 600001',
    'company_email': 'hr@cybomb.com',
    'company_contact': '+91-9876543210',
    'offer_date': new Date().toLocaleDateString('en-IN'),
    'hr_name': 'Ms. Priya Sharma',
    'hr_designation': 'HR Manager',
    'employment_type': 'Full-time',
    'probation_period': '3 months',
    'notice_period': '30 days',
    'working_hours': '9:00 AM - 6:00 PM (Monday to Friday)'
  };
  return defaults[key];
};

// Get single generated letter
const getGeneratedLetter = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findById(req.params.id)
      .populate('templateId', 'name description templateType')
      .populate('generatedBy', 'name email');
    
    if (!letter) {
      return res.status(404).json({ 
        success: false,
        message: 'Generated letter not found' 
      });
    }
    
    res.json({
      success: true,
      data: letter
    });
  } catch (error) {
    console.error('Get generated letter error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch generated letter',
      error: error.message 
    });
  }
};

// Update generated letter
const updateGeneratedLetter = async (req, res) => {
  try {
    const { formData, status, htmlContent } = req.body;
    
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ 
        success: false,
        message: 'Generated letter not found' 
      });
    }
    
    if (formData) {
      letter.candidateName = formData.candidate_name || formData.contractor_name || letter.candidateName;
      letter.candidateEmail = formData.email || letter.candidateEmail;
      letter.designation = formData.designation || formData.title || letter.designation;
      letter.formData = { ...letter.formData, ...formData };
      
      // Regenerate HTML content if template exists
      const template = await OfferLetter.findById(letter.templateId);
      if (template) {
        let generatedLetter = template.template;
        
        const allVariables = template.variables || [];
        allVariables.forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = letter.formData[key] || getDefaultValue(key) || '';
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
      .populate('templateId', 'name description templateType')
      .populate('generatedBy', 'name email');
    
    res.json({
      success: true,
      message: 'Generated letter updated successfully',
      data: updatedLetter
    });
  } catch (error) {
    console.error('Update generated letter error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update generated letter',
      error: error.message 
    });
  }
};

// Delete generated letter
const deleteGeneratedLetter = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findByIdAndDelete(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ 
        success: false,
        message: 'Generated letter not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Generated letter deleted successfully' 
    });
  } catch (error) {
    console.error('Delete generated letter error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete generated letter',
      error: error.message 
    });
  }
};

// Get all generated letters with enhanced filtering
const getGeneratedLetters = async (req, res) => {
  try {
    const { status, page = 1, limit = 50, search } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { candidateEmail: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { trackingId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const letters = await GeneratedLetter.find(query)
      .populate('templateId', 'name description templateType category')
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await GeneratedLetter.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        letters,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get generated letters error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch generated letters',
      error: error.message 
    });
  }
};

// Download PDF
const downloadPDF = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ 
        success: false,
        message: 'Generated letter not found' 
      });
    }
    
    const pdfBuffer = await generatePDF(letter.htmlContent);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offer-letter-${letter.candidateName.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating PDF',
      error: error.message 
    });
  }
};

// Send offer letter via email
const sendOfferLetter = async (req, res) => {
  try {
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ 
        success: false,
        message: 'Generated letter not found' 
      });
    }
    
    if (!letter.candidateEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'Candidate email is required' 
      });
    }
    
    const pdfBuffer = await generatePDF(letter.htmlContent);
    
    const emailResult = await sendOfferLetterEmail(
      letter.candidateEmail,
      letter.candidateName,
      pdfBuffer,
      letter.formData,
      letter.trackingId
    );
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send email: ' + emailResult.error 
      });
    }
    
    letter.status = 'sent';
    letter.sentAt = new Date();
    letter.sentTo = letter.candidateEmail;
    await letter.save();
    
    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      data: {
        emailId: emailResult.messageId,
        trackingId: letter.trackingId,
        sentAt: letter.sentAt
      }
    });
  } catch (error) {
    console.error('Send offer letter error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending offer letter',
      error: error.message 
    });
  }
};

// Get offer letter statistics
const getOfferLetterStats = async (req, res) => {
  try {
    const totalLetters = await GeneratedLetter.countDocuments();
    const sentLetters = await GeneratedLetter.countDocuments({ status: 'sent' });
    const acceptedLetters = await GeneratedLetter.countDocuments({ status: 'accepted' });
    const draftLetters = await GeneratedLetter.countDocuments({ status: 'draft' });
    const rejectedLetters = await GeneratedLetter.countDocuments({ status: 'rejected' });
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await GeneratedLetter.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Monthly stats for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await GeneratedLetter.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalLetters,
        sent: sentLetters,
        accepted: acceptedLetters,
        draft: draftLetters,
        rejected: rejectedLetters,
        recentActivity: recentActivity,
        monthlyStats: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message 
    });
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
  getOfferLetterStats,
  upload,
  handleUploadError
};