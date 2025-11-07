const HRLetter = require('../models/HRLetter');
const { getTemplate } = require('../utils/letterTemplates');
const pdfGenerator = require('../utils/pdfGenerator');

const hrLettersController = {
  // Generate new HR letter
  generateLetter: async (req, res) => {
    try {
      console.log('Generate letter request received:', {
        user: req.user,
        letterType: req.body.letterType,
        isRegeneration: req.body.isRegeneration
      });

      const {
        letterType,
        candidateName,
        candidateEmail,
        candidateAddress,
        designation,
        department,
        salary,
        previousSalary,
        joiningDate,
        effectiveDate,
        lastWorkingDay,
        reason,
        duration,
        workLocation,
        reportingManager,
        hikePercentage,
        previousDesignation,
        promotionReason,
        noticePeriod,
        responsibilities,
        achievements,
        companyDetails,
        originalLetterId,
        isRegeneration = false
      } = req.body;

      // Validate required fields
      if (!letterType || !candidateName || !candidateEmail || !designation) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: letterType, candidateName, candidateEmail, designation'
        });
      }

      const validLetterTypes = ['offer', 'appointment', 'hike', 'promotion', 'termination', 'experience'];
      if (!validLetterTypes.includes(letterType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid letter type. Must be one of: ${validLetterTypes.join(', ')}`
        });
      }

      // Prepare data for template
      const templateData = {
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidateAddress: candidateAddress?.trim() || 'Not specified',
        designation: designation.trim(),
        department: department?.trim() || 'Not specified',
        salary: salary || { basic: 0, hra: 0, specialAllowance: 0, total: 0 },
        previousSalary: previousSalary || null,
        joiningDate: joiningDate || new Date(),
        effectiveDate: effectiveDate || new Date(),
        lastWorkingDay: lastWorkingDay || null,
        reason: reason?.trim() || 'Not specified',
        duration: duration?.trim() || 'Not specified',
        workLocation: workLocation?.trim() || 'Not specified',
        reportingManager: reportingManager?.trim() || 'Not specified',
        hikePercentage: hikePercentage || 0,
        previousDesignation: previousDesignation?.trim() || 'Not specified',
        promotionReason: promotionReason?.trim() || 'Not specified',
        noticePeriod: noticePeriod?.trim() || 'Not specified',
        responsibilities: responsibilities?.trim() || 'Not specified',
        achievements: achievements?.trim() || 'Not specified',
        companyDetails: companyDetails || {
          name: 'Cybomb Technologies LLP',
          address: {
            line1: '',
            line2: '',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '',
            country: 'India'
          },
          phone: '',
          email: '',
          website: '',
          hrManagerName: 'HR Manager'
        }
      };

      console.log('Generating template for:', letterType);
      
      // Generate HTML content
      let htmlContent;
      try {
        htmlContent = getTemplate(letterType, templateData);
        
        if (!htmlContent || typeof htmlContent !== 'string') {
          throw new Error('Template returned invalid content');
        }
        
        console.log('HTML template generated successfully, length:', htmlContent.length);
      } catch (templateError) {
        console.error('Template generation error:', templateError);
        return res.status(400).json({
          success: false,
          message: `Failed to generate template for ${letterType}: ${templateError.message}`
        });
      }

      // Generate PDF
      let pdfBuffer;
      try {
        pdfBuffer = await pdfGenerator.generatePDF(htmlContent);
        console.log('PDF buffer generated successfully, size:', pdfBuffer.length);
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        return res.status(500).json({
          success: false,
          message: `PDF generation failed: ${pdfError.message}`
        });
      }

      // Create file name
      const fileName = `${letterType}_${candidateName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      // Prepare HR Letter data
      const hrLetterData = {
        letterType,
        candidateName: templateData.candidateName,
        candidateEmail: templateData.candidateEmail,
        candidateAddress: templateData.candidateAddress,
        designation: templateData.designation,
        department: templateData.department,
        salary: templateData.salary,
        previousSalary: templateData.previousSalary,
        joiningDate: templateData.joiningDate,
        effectiveDate: templateData.effectiveDate,
        lastWorkingDay: templateData.lastWorkingDay,
        reason: templateData.reason,
        duration: templateData.duration,
        workLocation: templateData.workLocation,
        reportingManager: templateData.reportingManager,
        hikePercentage: templateData.hikePercentage,
        previousDesignation: templateData.previousDesignation,
        promotionReason: templateData.promotionReason,
        noticePeriod: templateData.noticePeriod,
        responsibilities: templateData.responsibilities,
        achievements: templateData.achievements,
        companyDetails: templateData.companyDetails,
        generatedBy: req.user.id,
        letterContent: {
          html: htmlContent,
          pdfBuffer: pdfBuffer
        },
        fileName: fileName,
        status: 'generated'
      };

      // Handle regeneration case
      if (isRegeneration && originalLetterId) {
        hrLetterData.originalLetterId = originalLetterId;
        hrLetterData.isModified = true;
        
        // Find original letter to mark it as modified
        await HRLetter.findByIdAndUpdate(originalLetterId, {
          isModified: true,
          modifiedData: {
            candidateName: templateData.candidateName,
            candidateEmail: templateData.candidateEmail,
            candidateAddress: templateData.candidateAddress,
            designation: templateData.designation,
            department: templateData.department,
            salary: templateData.salary,
            previousSalary: templateData.previousSalary,
            joiningDate: templateData.joiningDate,
            effectiveDate: templateData.effectiveDate,
            lastWorkingDay: templateData.lastWorkingDay,
            reason: templateData.reason,
            duration: templateData.duration,
            workLocation: templateData.workLocation,
            reportingManager: templateData.reportingManager,
            hikePercentage: templateData.hikePercentage,
            previousDesignation: templateData.previousDesignation,
            promotionReason: templateData.promotionReason,
            noticePeriod: templateData.noticePeriod,
            responsibilities: templateData.responsibilities,
            achievements: templateData.achievements,
            companyDetails: templateData.companyDetails
          }
        });
      }

      console.log('Saving letter to database...');
      const hrLetter = new HRLetter(hrLetterData);
      await hrLetter.save();

      console.log('Letter saved successfully with ID:', hrLetter._id);

      res.status(201).json({
        success: true,
        message: isRegeneration ? 'Letter regenerated successfully!' : 'Letter generated successfully!',
        data: {
          id: hrLetter._id,
          letterType: hrLetter.letterType,
          candidateName: hrLetter.candidateName,
          fileName: hrLetter.fileName,
          status: hrLetter.status,
          isModified: hrLetter.isModified,
          originalLetterId: hrLetter.originalLetterId,
          downloadUrl: `/api/hrletters/download/${hrLetter._id}`,
          previewUrl: `/api/hrletters/preview/${hrLetter._id}`
        }
      });

    } catch (error) {
      console.error('Error generating letter:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate letter',
        error: error.message
      });
    }
  },

  // Update letter data and regenerate
  updateAndRegenerate: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('Update and regenerate request for ID:', id, 'with data:', updateData);

      // Find existing letter
      const existingLetter = await HRLetter.findById(id);
      if (!existingLetter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      // Prepare data for regeneration
      const regenerationData = {
        ...existingLetter.toObject(),
        ...updateData,
        isRegeneration: true,
        originalLetterId: existingLetter.originalLetterId || existingLetter._id
      };

      // Remove MongoDB specific fields
      delete regenerationData._id;
      delete regenerationData.__v;
      delete regenerationData.createdAt;
      delete regenerationData.updatedAt;

      // Call generateLetter with the updated data
      req.body = regenerationData;
      return hrLettersController.generateLetter(req, res);

    } catch (error) {
      console.error('Error updating and regenerating letter:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update and regenerate letter',
        error: error.message
      });
    }
  },

  // Download PDF - uses modified data if available
  downloadPDF: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('Download PDF request for ID:', id);
      
      // Find letter with PDF buffer
      const letter = await HRLetter.findById(id).select('letterContent.pdfBuffer fileName isModified modifiedData');
      
      if (!letter) {
        console.log('Letter not found for ID:', id);
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      console.log('Letter found:', letter.fileName);
      
      const pdfBuffer = letter.letterContent?.pdfBuffer;

      // Check if PDF buffer exists
      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        console.log('PDF buffer missing or invalid');
        return res.status(400).json({
          success: false,
          message: 'PDF not available for this letter'
        });
      }

      console.log('Sending PDF, size:', pdfBuffer.length);
      
      // Set headers and send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${letter.fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error in downloadPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download PDF',
        error: error.message
      });
    }
  },

  // Preview HTML content
  previewHTML: async (req, res) => {
    try {
      const { id } = req.params;
      
      const letter = await HRLetter.findById(id);
      
      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      if (!letter.letterContent || !letter.letterContent.html) {
        return res.status(404).json({
          success: false,
          message: 'HTML content not available for this letter'
        });
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(letter.letterContent.html);

    } catch (error) {
      console.error('Error previewing letter:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview letter',
        error: error.message
      });
    }
  },

  // Get all letters with pagination and filtering
  getAllLetters: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, letterType } = req.query;
      
      const query = {};
      
      // Search by candidate name or email
      if (search) {
        query.$or = [
          { candidateName: { $regex: search, $options: 'i' } },
          { candidateEmail: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Filter by letter type
      if (letterType) {
        query.letterType = letterType;
      }

      const letters = await HRLetter.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-letterContent.pdfBuffer -letterContent.html')
        .populate('generatedBy', 'name email');

      const total = await HRLetter.countDocuments(query);

      res.json({
        success: true,
        data: letters,
        pagination: {
          current: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      });

    } catch (error) {
      console.error('Error fetching letters:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch letters',
        error: error.message
      });
    }
  },

  // Get single letter by ID
  getLetterById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const letter = await HRLetter.findById(id)
        .select('-letterContent.pdfBuffer')
        .populate('generatedBy', 'name email');
      
      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      res.json({
        success: true,
        data: letter
      });

    } catch (error) {
      console.error('Error fetching letter:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch letter',
        error: error.message
      });
    }
  },

  // Delete letter
  deleteLetter: async (req, res) => {
    try {
      const { id } = req.params;
      
      const letter = await HRLetter.findByIdAndDelete(id);
      
      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      res.json({
        success: true,
        message: 'Letter deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting letter:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete letter',
        error: error.message
      });
    }
  },

  // Get letter statistics
  getStatistics: async (req, res) => {
    try {
      const stats = await HRLetter.aggregate([
        {
          $group: {
            _id: '$letterType',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalLetters = await HRLetter.countDocuments();
      
      // Get recent letters count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLetters = await HRLetter.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          byType: stats,
          total: totalLetters,
          recent: recentLetters
        }
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }
};

module.exports = hrLettersController;