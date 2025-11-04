const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const { authMiddleware: auth } = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const jwt = require('jsonwebtoken');

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = 'uploads/policies/';
      
      // Create directory if it doesn't exist
      if (!fsSync.existsSync(uploadDir)) {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'policy-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

// Middleware to authenticate via token query parameter for document access
const authQueryToken = (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Helper function to get active document
const getActiveDocument = (policy) => {
  if (!policy || !policy.documents || !Array.isArray(policy.documents)) {
    return null;
  }
  
  const activeDocuments = policy.documents.filter(doc => doc.status === 'active');
  return activeDocuments.length > 0 ? activeDocuments[0] : null;
};

// @route   GET /api/policies
// @desc    Get all policies with active document info
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const policies = await Policy.find({ isActive: true })
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ createdAt: -1 });

    // Add active document to each policy for easier frontend access
    const policiesWithDocument = policies.map(policy => {
      const policyObj = policy.toObject();
      const activeDocument = getActiveDocument(policy);
      policyObj.document = activeDocument; // Add document field for frontend compatibility
      return policyObj;
    });

    res.json({
      success: true,
      data: policiesWithDocument,
      count: policiesWithDocument.length
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/categories/list
// @desc    Get all policy categories
// @access  Private
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await Policy.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/search/:query
// @desc    Search policies
// @access  Private
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    
    const policies = await Policy.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { policyType: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    // Add active document to each policy
    const policiesWithDocument = policies.map(policy => {
      const policyObj = policy.toObject();
      const activeDocument = getActiveDocument(policy);
      policyObj.document = activeDocument;
      return policyObj;
    });

    res.json({
      success: true,
      data: policiesWithDocument,
      count: policiesWithDocument.length
    });
  } catch (error) {
    console.error('Error searching policies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/:id
// @desc    Get single policy with active document
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    // Add active document for frontend
    const policyObj = policy.toObject();
    const activeDocument = getActiveDocument(policy);
    policyObj.document = activeDocument;

    res.json({
      success: true,
      data: policyObj
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/:id/document
// @desc    Serve active policy document from file system
// @access  Private (with token query parameter support)
router.get('/:id/document', authQueryToken, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    const document = getActiveDocument(policy);
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: 'No active document found for this policy' 
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (err) {
      console.error('File not found on server:', document.filePath);
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    // Set appropriate headers
    // FIX for COEP/CORP violation in iframe: Add Cross-Origin-Resource-Policy header
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const fileStream = fsSync.createReadStream(document.filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file',
          error: error.message
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/:id/document/:docId
// @desc    Serve specific policy document from file system
// @access  Private (with token query parameter support)
router.get('/:id/document/:docId', authQueryToken, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    const document = policy.documents.id(req.params.docId);
    
    if (!document || document.status !== 'active') {
      return res.status(404).json({ 
        success: false,
        message: 'Document not found' 
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (err) {
      console.error('File not found on server:', document.filePath);
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    // Set appropriate headers
    // FIX for COEP/CORP violation in iframe: Add Cross-Origin-Resource-Policy header
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const fileStream = fsSync.createReadStream(document.filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file',
          error: error.message
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/policies
// @desc    Create new policy
// @access  Private (Admin/Employer)
router.post('/', [
  auth,
  upload.single('document'),
  handleMulterError,
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('policyType', 'Policy type is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Clean up uploaded file if validation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    // Check user role
    if (!['admin', 'employer'].includes(req.user.role)) {
      // Clean up uploaded file if unauthorized
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin and employer can create policies.' 
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Policy document is required'
      });
    }
    
    const { title, policyType, category, content, tags } = req.body;

    // Get file extension
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Create document object
    const document = {
      name: req.file.filename,
      originalName: req.file.originalname,
      section: 'policy',
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType: fileExtension.replace('.', ''),
      uploadedBy: req.user.employeeId || req.user.id,
      status: 'active'
    };

    const policy = new Policy({
      title,
      policyType,
      category,
      content: content || '',
      documents: [document],
      tags: tags ? JSON.parse(tags) : [],
      createdBy: req.user.id
    });

    await policy.save();
    
    // Populate and add document field for response
    await Policy.populate(policy, { 
      path: 'createdBy', 
      select: 'name email' 
    });
    
    const policyObj = policy.toObject();
    policyObj.document = document;

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policyObj
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    
    // Clean up uploaded file if policy creation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    if (error.message && (error.message.includes('file too large') || error.message.includes('Invalid file type'))) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Handle JSON parsing errors for tags
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tags format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/policies/:id
// @desc    Update policy
// @access  Private (Admin/Employer)
router.put('/:id', [
  auth,
  upload.single('document'),
  handleMulterError,
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('policyType', 'Policy type is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Clean up uploaded file if validation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    // Check user role
    if (!['admin', 'employer'].includes(req.user.role)) {
      // Clean up uploaded file if unauthorized
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin and employer can update policies.' 
      });
    }

    const { title, policyType, category, content, tags } = req.body;

    let policy = await Policy.findById(req.params.id);

    if (!policy) {
      // Clean up uploaded file if policy not found
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    const updateFields = {
      title,
      policyType,
      category,
      content: content || '',
      tags: tags ? JSON.parse(tags) : policy.tags,
      lastModifiedBy: req.user.id
    };

    // If a new file is uploaded, update the document
    if (req.file) {
      // Get file extension
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      // Mark old active documents as deleted
      policy.documents.forEach(doc => {
        if (doc.status === 'active') {
          doc.status = 'deleted';
        }
      });

      // Create new document object
      const newDocument = {
        name: req.file.filename,
        originalName: req.file.originalname,
        section: 'policy',
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType: fileExtension.replace('.', ''),
        uploadedBy: req.user.employeeId || req.user.id,
        status: 'active'
      };

      // Add new document to the array
      policy.documents.push(newDocument);
      await policy.save();
    }
    
    // Update policy fields
    policy = await Policy.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

    // Add active document for response
    const policyObj = policy.toObject();
    const activeDocument = getActiveDocument(policy);
    policyObj.document = activeDocument;

    res.json({
      success: true,
      message: 'Policy updated successfully',
      data: policyObj
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    
    // Clean up uploaded file if update fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    if (error.message && (error.message.includes('file too large') || error.message.includes('Invalid file type'))) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Handle JSON parsing errors for tags
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tags format'
      });
    }
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/policies/:id
// @desc    Delete policy (soft delete)
// @access  Private (Admin/Employer)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check user role
    if (!['admin', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin and employer can delete policies.' 
      });
    }

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    // Soft delete
    policy.isActive = false;
    policy.lastModifiedBy = req.user.id;
    await policy.save();

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting policy:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/policies/:id/document/:docId
// @desc    Delete policy document
// @access  Private (Admin/Employer)
router.delete('/:id/document/:docId', auth, async (req, res) => {
  try {
    // Check user role
    if (!['admin', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin and employer can delete policy documents.' 
      });
    }

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    const document = policy.documents.id(req.params.docId);
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: 'Document not found' 
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (err) {
      console.warn(`Could not delete file: ${document.filePath}`, err.message);
    }

    // Remove document from policy (soft delete)
    document.status = 'deleted';
    await policy.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting policy document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;