// routes/employeeProfileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Add this missing import
const {
  createOrUpdateProfile,
  getProfile,
  uploadDocument,
  deleteDocument,
  uploadIdentityDocument, 
  deleteIdentityDocument, 
  uploadProfilePicture,
  downloadDocument,
  getEmployeeDocuments
} = require('../controllers/employeeProfileController');

const router = express.Router();

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.employeeId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for profile pictures
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.employeeId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed.'), false);
  }
};

// File filter for profile pictures
const profilePicFileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF files are allowed.'), false);
  }
};

// Create multer instances
const uploadDocumentMiddleware = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadProfilePicMiddleware = multer({
  storage: profilePicStorage,
  fileFilter: profilePicFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET employee profile
router.get('/:employeeId', getProfile);
router.get('/:employeeId/documents', getEmployeeDocuments);
router.get('/:employeeId/documents/:documentId/download', downloadDocument);

// PUT create or update employee profile
router.put('/:employeeId', createOrUpdateProfile);
// router.post('/:employeeId/education', addEducation);
// router.post('/:employeeId/work-experience', addWorkExperience);

// POST upload document
router.post('/:employeeId/documents', uploadDocumentMiddleware.single('document'), uploadDocument);

// DELETE document
router.delete('/:employeeId/documents/:documentId', deleteDocument);

// POST upload identity document
router.post('/:employeeId/identity-documents', uploadDocumentMiddleware.single('document'), uploadIdentityDocument);

// DELETE identity document
router.delete('/:employeeId/identity-documents/:documentId', deleteIdentityDocument);

// POST upload profile picture
router.post('/:employeeId/profile-picture', uploadProfilePicMiddleware.single('profilePicture'), uploadProfilePicture);

module.exports = router;