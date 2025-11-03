// controllers/offerLetterController.js
const OfferLetter = require('../models/OfferLetter');
const GeneratedLetter = require('../models/GeneratedLetter');
const { generatePDF } = require('../utils/pdfGenerator');
const { sendOfferLetterEmail } = require('../utils/emailService');

// Get all offer letter templates
const getTemplates = async (req, res) => {
  try {
    const templates = await OfferLetter.find({ isActive: true })
      .select('name description variables createdAt')
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
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

// Create new template
const createTemplate = async (req, res) => {
  try {
    const { name, description, template } = req.body;
    
    if (!name || !description || !template) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const newTemplate = new OfferLetter({
      name,
      description,
      template,
      createdBy: req.user.id // Requires successful auth
    });
    
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

// Generate offer letter (This is where the DB save happens for backend templates)
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
      candidateName: data.candidate_name,
      candidateEmail: data.email,
      designation: data.designation,
      htmlContent: generatedLetter,
      formData: data,
      generatedBy: req.user.id, // Requires successful auth
      status: 'draft'
    });
    
    await savedLetter.save(); // Data is successfully saved to DB here
    
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
    const { name, description, template, isActive } = req.body;
    
    const updatedTemplate = await OfferLetter.findByIdAndUpdate(
      req.params.id,
      { name, description, template, isActive },
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
    const template = await OfferLetter.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
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
      .populate('templateId', 'name description')
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
      .populate('templateId', 'name template variables')
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


const updateGeneratedLetter = async (req, res) => {
  try {
    const { formData, status, htmlContent } = req.body;
    
    const letter = await GeneratedLetter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Generated letter not found' });
    }
    
    // Always regenerate HTML content when formData is provided
    if (formData) {
      // Update basic fields from formData
      letter.candidateName = formData.candidate_name || letter.candidateName;
      letter.candidateEmail = formData.email || letter.candidateEmail;
      letter.designation = formData.designation || letter.designation;
      
      // Update formData - merge with existing formData
      letter.formData = { ...letter.formData, ...formData };
      
      // Get the original template to regenerate HTML
      const template = await OfferLetter.findById(letter.templateId);
      if (template) {
        let generatedLetter = template.template;
        
        // Replace all placeholders with updated form data
        Object.keys(letter.formData).forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = letter.formData[key] || '';
          generatedLetter = generatedLetter.replace(new RegExp(placeholder, 'g'), value);
        });
        
        // Clean up any unreplaced placeholders
        generatedLetter = generatedLetter.replace(/{{(\w+)}}/g, '');
        
        // Update the HTML content with regenerated content
        letter.htmlContent = generatedLetter;
      } else {
        // If no template found (shouldn't happen), use the provided htmlContent
        if (htmlContent) {
          letter.htmlContent = htmlContent;
        }
      }
    } else if (htmlContent) {
      // If htmlContent is provided directly, use it
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
    
    // Update the updatedAt timestamp
    letter.updatedAt = new Date();
    
    await letter.save(); // Data is successfully updated in DB here
    
    // Populate the updated letter to return complete data
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
    
    // Generate PDF
    const pdfBuffer = await generatePDF(letter.htmlContent);
    
    // Send email
    const emailResult = await sendOfferLetterEmail(
      letter.candidateEmail,
      letter.candidateName,
      pdfBuffer,
      letter.formData
    );
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send email: ' + emailResult.error });
    }
    
    // Update letter status
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
  generateOfferLetter,
  updateTemplate,
  deleteTemplate,
  getGeneratedLetters,
  getGeneratedLetter,
  updateGeneratedLetter,
  deleteGeneratedLetter,
  downloadPDF,
  sendOfferLetter
};