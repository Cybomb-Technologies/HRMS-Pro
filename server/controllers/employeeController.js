const Employee = require('../models/Employee.js');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

// GET all employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      personalEmail,
      workPhone,
      department, 
      designation, 
      role,
      employmentType,
      status,
      sourceOfHire,
      location,
      dateOfJoining,
      dateOfBirth,
      maritalStatus,
      totalExperience,
      gender, 
      reportingManager,
      employeeId, 
      password 
    } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = employeeId.trim();

    // Check for duplicates
    const [existingEmployeeByEmail, existingEmployeeById, existingUser] = await Promise.all([
      Employee.findOne({ email: normalizedEmail }),
      Employee.findOne({ employeeId: normalizedEmployeeId }),
      User.findOne({ email: normalizedEmail })
    ]);

    if (existingEmployeeByEmail) {
      return res.status(400).json({ 
        error: 'Employee already exists',
        details: `workEmail ${normalizedEmail} is already registered`,
        field: 'email'
      });
    }
    
    if (existingEmployeeById) {
      return res.status(400).json({ 
        error: 'Employee already exists', 
        details: `Employee ID ${normalizedEmployeeId} is already in use`,
        field: 'employeeId'
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        details: `User account with workEmail ${normalizedEmail} already exists`,
        field: 'email'
      });
    }

    // Create employee
    const newEmployee = new Employee({ 
      employeeId: normalizedEmployeeId, 
      name, 
      email: normalizedEmail, 
      personalEmail,
      workPhone,
      department, 
      designation,
      role,
      employmentType,
      status,
      sourceOfHire,
      location,
      dateOfJoining,
      dateOfBirth,
      maritalStatus,
      gender, 
      reportingManager,
      totalExperience
    });
    
    await newEmployee.save();

    // Hash password before saving user
    const employeePassword = password || "Password123";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(employeePassword, saltRounds);

    // Create user with hashed password
    const newUser = new User({ 
      email: normalizedEmail, 
      password: hashedPassword,
      role: 'employee', 
      employeeId: normalizedEmployeeId
    });
    
    await newUser.save();

    res.status(201).json({ 
      employee: newEmployee,
      tempPassword: !password ? employeePassword : undefined,
      message: `Employee ${name} created successfully. Login email: ${normalizedEmail}`
    });
    } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: err.message });
  }
};

// LOGIN employee
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Work email and password are required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by workEmail
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Find employee details
    const employee = await Employee.findOne({ email: normalizedEmail });
    if (!employee) {
      return res.status(404).json({ 
        error: 'Employee record not found' 
      });
    }

    // Login successful
    res.json({
      message: 'Login successful',
      user: {
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      },
      employee: {
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        employeeId: employee.employeeId
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ employeeId: id });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete all documents from file system
    if (employee.documents && employee.documents.length > 0) {
      const deletePromises = employee.documents.map(async (doc) => {
        try {
          await fs.unlink(doc.filePath);
        } catch (err) {
          console.warn(`Could not delete file: ${doc.filePath}`, err.message);
        }
      });
      await Promise.all(deletePromises);
    }

    // Delete employee and user records
    await Employee.findOneAndDelete({ employeeId: id });
    await User.findOneAndDelete({ employeeId: id });

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findOne({ employeeId: id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If password is being updated, hash it and update User collection
    if (updateData.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(updateData.password, saltRounds);
      
      await User.findOneAndUpdate(
        { employeeId: id },
        { password: hashedPassword }
      );
      
      delete updateData.password;
    }

    // Update workEmail in both collections if changed
    if (updateData.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();
      updateData.email = normalizedEmail;
      
      // Also update in User collection
      await User.findOneAndUpdate(
        { employeeId: id },
        { email: normalizedEmail }
      );
    }

    // Update other fields in Employee collection
    Object.keys(updateData).forEach(key => {
      employee[key] = updateData[key];
    });

    await employee.save();

    res.status(200).json({ 
      message: 'Employee updated successfully', 
      employee 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DOCUMENT MANAGEMENT CONTROLLERS

// Upload documents
exports.uploadDocuments = async (req, res) => {
  try {
    // Get empId and section from req object (set by middleware)
    const empId = req.empId;
    const section = req.section;
    
    console.log('Upload request received:', { 
      empId, 
      section, 
      filesCount: req.files ? req.files.length : 0 
    }); // Debug log
    
    if (!empId || !section) {
      return res.status(400).json({
        error: 'Employee ID and section are required',
        received: { empId, section }
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    const employee = await Employee.findOne({ employeeId: empId });
    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found'
      });
    }

    // Validate section
    const validSections = ['identity', 'education', 'work_experience', 'banking'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        error: 'Invalid document section'
      });
    }

    // Process uploaded files
    const documents = req.files.map(file => ({
      name: file.originalname,
      originalName: file.originalname,
      section: section,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileType: path.extname(file.originalname).toLowerCase(),
      uploadedBy: empId
    }));

    // Add documents to employee
    await employee.addDocuments(documents);

    res.status(200).json({
      message: `${documents.length} document(s) uploaded successfully`,
      documents: documents.map(doc => ({
        id: doc._id,
        name: doc.name,
        section: doc.section,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate
      }))
    });

  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({
      error: 'Failed to upload documents',
      details: err.message
    });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const { empId } = req.query;

    console.log('Download request:', { docId, empId }); // Debug log

    if (!empId) {
      return res.status(400).json({
        error: 'Employee ID is required'
      });
    }

    const employee = await Employee.findOne({ employeeId: empId });
    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found'
      });
    }

    // Find document by ID - using mongoose's id() method
    const document = employee.documents.id(docId);
    if (!document) {
      console.log('Document not found in employee documents:', employee.documents); // Debug log
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (err) {
      console.error('File not found on server:', document.filePath);
      return res.status(404).json({
        error: 'File not found on server'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Length', document.fileSize);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(document.filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({
        error: 'Error streaming file'
      });
    });

    fileStream.pipe(res);

  } catch (err) {
    console.error('Document download error:', err);
    res.status(500).json({
      error: 'Failed to download document',
      details: err.message
    });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const { empId } = req.query;

    if (!empId) {
      return res.status(400).json({
        error: 'Employee ID is required'
      });
    }

    const employee = await Employee.findOne({ employeeId: empId });
    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found'
      });
    }

    const document = employee.documents.id(docId);
    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (err) {
      console.warn(`Could not delete file: ${document.filePath}`, err.message);
    }

    // Remove document from employee record
    await employee.removeDocument(docId);

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (err) {
    console.error('Document deletion error:', err);
    res.status(500).json({
      error: 'Failed to delete document',
      details: err.message
    });
  }
};

// Get employee documents by section
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { empId } = req.params;
    const { section } = req.query;

    console.log('Fetching documents for:', { empId, section }); // Debug log

    const employee = await Employee.findOne({ employeeId: empId });
    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found'
      });
    }

    let documents;
    if (section) {
      documents = employee.getDocumentsBySection(section);
    } else {
      // Return all active documents
      documents = employee.documents.filter(doc => doc.status === 'active');
    }

    console.log('Found documents:', documents.length); // Debug log

    res.json({
      employeeId: empId,
      documents: documents.map(doc => ({
        id: doc._id,
        name: doc.name,
        section: doc.section,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate,
        fileType: doc.fileType
      })),
      documentStatus: employee.documentUploadStatus
    });

  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({
      error: 'Failed to fetch documents',
      details: err.message
    });
  }
};