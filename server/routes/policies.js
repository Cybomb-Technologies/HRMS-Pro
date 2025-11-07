const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const Employee = require('../models/Employee');
const User = require('../models/User');
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
      
      if (!fsSync.existsSync(uploadDir)) {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
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
    fileSize: 5 * 1024 * 1024
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

// in policies.js, keep your existing function but add the fallback:
const authQueryToken = async (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success:false, message:'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!decoded.employeeId && decoded.id) {
      const emp = await Employee.findById(decoded.id).select('employeeId');
      if (emp?.employeeId) decoded.employeeId = emp.employeeId;
    }

    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success:false, message:'Invalid token' });
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

// @route   GET /api/policies/employees/validate
// @desc    Fetch employees by list of empids and validate them
// @access  Private (Admin/Employer/HR)
router.get('/employees/validate', auth, async (req, res) => {
  try {
    if (!['admin', 'employer', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin, employer and HR can access employee validation.' 
      });
    }
    
    const { empIds } = req.query;
    if (!empIds) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee IDs (empIds) query parameter is required.' 
      });
    }

    const employeeIdArray = empIds.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (employeeIdArray.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid employee IDs provided.' 
      });
    }

    const employees = await Employee.find({
      employeeId: { $in: employeeIdArray }
    }).select('employeeId name email designation department');

    const foundIds = employees.map(emp => emp.employeeId);
    const notFoundIds = employeeIdArray.filter(id => !foundIds.includes(id));

    res.json({
      success: true,
      data: {
        validEmployees: employees,
        invalidEmployeeIds: notFoundIds
      }
    });

  } catch (error) {
    console.error('Error validating employee IDs:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/employees/list
// @desc    Get all employees for dropdown selection
// @access  Private (Admin/Employer/HR)
router.get('/employees/list', auth, async (req, res) => {
  try {
    if (!['admin', 'employer', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin, employer and HR can access employee list.' 
      });
    }
    
    const employees = await Employee.find({})
      .select('employeeId name email designation department')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: employees,
      count: employees.length
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies
// @desc    Get all policies with active document info visible to the user
// @access  Private
router.get('/', auth, async (req, res) => {
  console.log('Logged-in user:', req.user);
  try {
    const userEmployeeId = req.user.employeeId;
    const userRole = req.user.role;
    

    let findQuery = { isActive: true };

    // Admin/Employer/HR can see ALL active policies
    if (['admin', 'employer', 'hr'].includes(userRole)) {
      const policies = await Policy.find(findQuery)
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ createdAt: -1 });

      const policiesWithDocument = policies.map(policy => {
        const policyObj = policy.toObject();
        const activeDocument = getActiveDocument(policy);
        policyObj.document = activeDocument;
        return policyObj;
      });

      return res.json({
        success: true,
        data: policiesWithDocument,
        count: policiesWithDocument.length
      });
    } else {
      // Regular employees only see policies visible to ALL or policies specifically allowed for their employeeId
      const policies = await Policy.find({
        isActive: true,
        $or: [
          { visibility: 'ALL' },
          { 
            visibility: 'SELECTED',
            allowedEmployeeIds: userEmployeeId 
          }
        ]
      })
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ createdAt: -1 });

      const policiesWithDocument = policies.map(policy => {
        const policyObj = policy.toObject();
        const activeDocument = getActiveDocument(policy);
        policyObj.document = activeDocument;
        return policyObj;
      });

      return res.json({
        success: true,
        data: policiesWithDocument,
        count: policiesWithDocument.length
      });
    }
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
    const userEmployeeId = req.user.employeeId;
    const userRole = req.user.role;
    
    let matchQuery = { isActive: true };
    
    if (!['admin', 'employer', 'hr'].includes(userRole)) {
      matchQuery.$or = [
        { visibility: 'ALL' },
        { 
          visibility: 'SELECTED',
          allowedEmployeeIds: userEmployeeId 
        }
      ];
    }
    
    const categories = await Policy.distinct('category', matchQuery);
    
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

// @route   GET /api/policies/:id
// @desc    Get single policy with active document, and check visibility
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

    const userEmployeeId = req.user.employeeId;
    const userRole = req.user.role;

    // Check visibility for regular employees
    if (!['admin', 'employer', 'hr'].includes(userRole)) {
      const isVisibleToAll = policy.visibility === 'ALL';
      const isSelectedEmployee = policy.visibility === 'SELECTED' && 
        policy.allowedEmployeeIds.includes(userEmployeeId);

      if (!isVisibleToAll && !isSelectedEmployee) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You are not authorized to view this policy.' 
        });
      }
    }
    
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
// @desc    Serve active policy document from file system - check visibility
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

    const userEmployeeId = req.user.employeeId;
    const userRole = req.user.role;

    // Check visibility for regular employees
    if (!['admin', 'employer', 'hr'].includes(userRole)) {
      const isVisibleToAll = policy.visibility === 'ALL';
      const isSelectedEmployee = policy.visibility === 'SELECTED' && 
        policy.allowedEmployeeIds.includes(userEmployeeId);

      if (!isVisibleToAll && !isSelectedEmployee) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. You are not authorized to view this policy document.' 
        });
      }
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

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

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
// @access  Private (Admin/Employer/HR)
router.post('/', [
  auth,
  upload.single('document'),
  handleMulterError,
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('policyType', 'Policy type is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim(),
    check('visibility', 'Visibility is required').not().isEmpty().isIn(['ALL', 'SELECTED'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
    if (!['admin', 'employer', 'hr'].includes(req.user.role)) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin, employer and HR can create policies.' 
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Policy document is required'
      });
    }
    
    const { title, policyType, category, content, tags, visibility, allowedEmployeeIds: allowedIdsString } = req.body;
    let allowedEmployeeIds = [];

    if (visibility === 'SELECTED' && allowedIdsString) {
      const rawIds = allowedIdsString.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (rawIds.length === 0) {
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        }
        return res.status(400).json({
          success: false,
          message: 'Visibility is set to SELECTED, but no valid Employee IDs were provided.'
        });
      }
      
      const existingEmployees = await Employee.find({ employeeId: { $in: rawIds } }).select('employeeId');
      allowedEmployeeIds = existingEmployees.map(emp => emp.employeeId);
      
      if (allowedEmployeeIds.length !== rawIds.length) {
        const notFoundIds = rawIds.filter(id => !allowedEmployeeIds.includes(id));
        console.warn('The following employee IDs were not found:', notFoundIds);
      }
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();

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
      visibility,
      allowedEmployeeIds: visibility === 'SELECTED' ? allowedEmployeeIds : [],
      tags: tags ? JSON.parse(tags) : [],
      documents: [document],
      createdBy: req.user.id
    });

    await policy.save();
    
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
// @access  Private (Admin/Employer/HR)
router.put('/:id', [
  auth,
  upload.single('document'),
  handleMulterError,
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('policyType', 'Policy type is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim(),
    check('visibility', 'Visibility is required').not().isEmpty().isIn(['ALL', 'SELECTED'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
    if (!['admin', 'employer', 'hr'].includes(req.user.role)) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin, employer and HR can update policies.' 
      });
    }

    const { title, policyType, category, content, tags, visibility, allowedEmployeeIds: allowedIdsString } = req.body;

    let allowedEmployeeIds = [];
    
    if (visibility === 'SELECTED' && allowedIdsString) {
      const rawIds = allowedIdsString.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (rawIds.length === 0) {
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        }
        return res.status(400).json({
          success: false,
          message: 'Visibility is set to SELECTED, but no valid Employee IDs were provided.'
        });
      }
      
      const existingEmployees = await Employee.find({ employeeId: { $in: rawIds } }).select('employeeId');
      allowedEmployeeIds = existingEmployees.map(emp => emp.employeeId);
      
      if (allowedEmployeeIds.length !== rawIds.length) {
        const notFoundIds = rawIds.filter(id => !allowedEmployeeIds.includes(id));
        console.warn('The following employee IDs were not found during update:', notFoundIds);
      }
    }

    let policy = await Policy.findById(req.params.id);

    if (!policy) {
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
      visibility,
      allowedEmployeeIds: visibility === 'SELECTED' ? allowedEmployeeIds : [],
      tags: tags ? JSON.parse(tags) : policy.tags,
      lastModifiedBy: req.user.id
    };

    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      policy.documents.forEach(doc => {
        if (doc.status === 'active') {
          doc.status = 'deleted';
        }
      });

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

      policy.documents.push(newDocument);
      await policy.save();
    }
    
    policy = await Policy.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

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
// @access  Private (Admin/Employer/HR)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'employer', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin, employer and HR can delete policies.' 
      });
    }

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

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

module.exports = router;