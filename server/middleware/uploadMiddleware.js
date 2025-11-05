const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const ensureUploadsDir = (empId) => {
  const uploadPath = path.join(__dirname, '../uploads', empId);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// Custom storage configuration for regular uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const empId = req.empId;
      
      if (!empId) {
        return cb(new Error('Employee ID is required'), null);
      }

      const uploadPath = ensureUploadsDir(empId);
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

// Template storage configuration
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const templatePath = path.join(__dirname, '../uploads/templates');
    if (!fs.existsSync(templatePath)) {
      fs.mkdirSync(templatePath, { recursive: true });
    }
    cb(null, templatePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = 'template-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, and Text documents are allowed.'), false);
  }
};

const templateFileFilter = (req, file, cb) => {
  const allowedTypes = ['.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Word documents (.doc, .docx) are allowed for templates.'), false);
  }
};

// Create multer instances
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const templateUpload = multer({
  storage: templateStorage,
  fileFilter: templateFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for templates
  }
});

// FIX: Export for backward compatibility
const uploadMiddleware = upload;
uploadMiddleware.upload = upload;
uploadMiddleware.templateUpload = templateUpload;

module.exports = uploadMiddleware;