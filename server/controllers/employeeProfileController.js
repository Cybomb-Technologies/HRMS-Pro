// controllers/employeeProfileController.js
const Employee = require('../models/Employee');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Create or update employee profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updateData = req.body;

    console.log('📝 Updating profile for:', employeeId);

    // Find employee by employeeId, email, or ObjectId
    let employee = await Employee.findOne({ 
      $or: [
        { employeeId: employeeId },
        { email: employeeId },
        { _id: mongoose.Types.ObjectId.isValid(employeeId) ? new mongoose.Types.ObjectId(employeeId) : null }
      ].filter(Boolean)
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Prepare update data for Employee model
    const employeeData = {
      // Personal Information
      firstName: updateData.firstName || employee.firstName || employee.name?.split(' ')[0] || '',
      lastName: updateData.lastName || employee.lastName || employee.name?.split(' ').slice(1).join(' ') || '',
      nickName: updateData.nickName || employee.nickName,
      dateOfBirth: updateData.dateOfBirth || employee.dateOfBirth,
      maritalStatus: updateData.maritalStatus || employee.maritalStatus,
      gender: updateData.gender || employee.gender,
      aboutMe: updateData.aboutMe || employee.aboutMe,
      bio: updateData.aboutMe || employee.bio, // Map aboutMe to bio
      expertise: updateData.expertise || employee.expertise,
      
      // Contact Information
      personalEmail: updateData.personalEmail || employee.personalEmail,
      personalMobile: updateData.personalMobile || employee.personalMobile,
      workPhone: updateData.workPhone || employee.workPhone,
      extension: updateData.extension || employee.extension,
      presentAddress: updateData.presentAddress || employee.presentAddress,
      permanentAddress: updateData.permanentAddress || employee.permanentAddress,
      seatingLocation: updateData.seatingLocation || employee.seatingLocation,
      
      // Work Information
      department: updateData.department || employee.department,
      designation: updateData.designation || employee.designation,
      zohoRole: updateData.zohoRole || employee.zohoRole,
      reportingManager: updateData.reportingManager || employee.reportingManager,
      location: updateData.location || employee.location,
      
      // Identity Information
      uan: updateData.uan || employee.uan,
      pan: updateData.pan || employee.pan,
      aadhaar: updateData.aadhaar || employee.aadhaar,
      
      // Arrays and Complex Data
      skills: updateData.skills || employee.skills || [],
      tags: updateData.tags || employee.tags || [],
      education: updateData.education || employee.education || [],
      workExperience: updateData.workExperience || employee.workExperience || [],
      dependents: updateData.dependents || employee.dependents || [],
      
      // System fields
      modifiedBy: employeeId,
      modifiedTime: new Date()
    };

    // Handle address if provided
    if (updateData.address) {
      employeeData.address = {
        ...employee.address,
        ...updateData.address
      };
    }

    // Handle emergency contact if provided
    if (updateData.emergencyContact) {
      employeeData.emergencyContact = {
        ...employee.emergencyContact,
        ...updateData.emergencyContact
      };
    }

    // Update the employee document
    employee = await Employee.findOneAndUpdate(
      { employeeId: employee.employeeId },
      { $set: employeeData },
      { new: true, runValidators: true }
    );

    console.log('✅ Employee profile saved successfully for:', employee.name);

    res.json({
      success: true,
      message: 'Profile saved successfully',
      data: employee
    });

  } catch (error) {
    console.error('❌ Error saving profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving profile',
      error: error.message
    });
  }
};
// Add to employeeProfileController.js

// Download document
const downloadDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const document = employee.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if file exists
    if (!document.filePath || !fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading document',
      error: error.message
    });
  }
};

// Get employee documents
const getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      documents: employee.documents || []
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching documents',
      error: error.message
    });
  }
};
// Get employee profile
const getProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    console.log('🔍 Fetching profile for:', employeeId);

    // Build query to handle both ObjectId and string employeeId
    let query = {};
    
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      query = { 
        $or: [
          { _id: new mongoose.Types.ObjectId(employeeId) },
          { employeeId: employeeId }
        ]
      };
    } else {
      query = {
        $or: [
          { employeeId: employeeId },
          { email: employeeId }
        ]
      };
    }

    // Get employee data with all fields
    const employee = await Employee.findOne(query).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('✅ Employee profile fetched successfully');
    
    res.json({
      success: true,
      data: {
        employee: employee
      }
    });

  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message
    });
  }
};

// Handle file uploads for documents
const uploadDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const newDocument = {
      name: file.originalname,
      type: req.body.documentType || 'General',
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadDate: new Date()
    };

    // Add document to employee's documents array
    employee.documents.push(newDocument);
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDocument
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading document',
      error: error.message
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const document = employee.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    employee.documents.pull({ _id: documentId });
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting document',
      error: error.message
    });
  }
};

// Upload identity document
const uploadIdentityDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const newDocument = {
      name: file.originalname,
      type: req.body.documentType || 'Identity',
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      identificationNumber: req.body.identificationNumber,
      uploadDate: new Date()
    };

    employee.identityDocuments.push(newDocument);
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Identity document uploaded successfully',
      data: newDocument
    });

  } catch (error) {
    console.error('Error uploading identity document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading identity document',
      error: error.message
    });
  }
};

// Delete identity document
const deleteIdentityDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const document = employee.identityDocuments.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    employee.identityDocuments.pull({ _id: documentId });
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Identity document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting identity document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting identity document',
      error: error.message
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ 
      $or: [
        { employeeId: employeeId },
        { email: employeeId },
        { _id: mongoose.Types.ObjectId.isValid(employeeId) ? new mongoose.Types.ObjectId(employeeId) : null }
      ].filter(Boolean)
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Delete old profile picture if exists
    if (employee.profilePicture && fs.existsSync(employee.profilePicture)) {
      fs.unlinkSync(employee.profilePicture);
    }

    // Update profile picture path - use relative path for frontend
    const relativePath = `/uploads/profile-pictures/${path.basename(file.path)}`;
    employee.profilePicture = relativePath;
    employee.profilePhoto = relativePath; // Set both fields for compatibility
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();

    await employee.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: relativePath
      }
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile picture',
      error: error.message
    });
  }
};

// Add education record
const addEducation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const educationData = req.body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.education.push(educationData);
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Education record added successfully',
      data: educationData
    });

  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding education record',
      error: error.message
    });
  }
};

// Add work experience
const addWorkExperience = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const experienceData = req.body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.workExperience.push(experienceData);
    employee.modifiedBy = employeeId;
    employee.modifiedTime = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Work experience added successfully',
      data: experienceData
    });

  } catch (error) {
    console.error('Error adding work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding work experience',
      error: error.message
    });
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfile,
  uploadDocument,
  deleteDocument,
  uploadIdentityDocument,
  deleteIdentityDocument,
  uploadProfilePicture,
  addEducation,
  addWorkExperience,
  getEmployeeDocuments,
  downloadDocument
};