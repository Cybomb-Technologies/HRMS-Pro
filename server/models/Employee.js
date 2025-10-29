const mongoose = require('mongoose');

// Sub-schemas
const educationSchema = new mongoose.Schema({
  instituteName: { type: String, required: true },
  degree: { type: String, required: true },
  specialization: { type: String },
  dateOfCompletion: { type: Date }
});

const workExperienceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date },
  jobDescription: { type: String },
  relevant: { type: Boolean, default: true }
});

const dependentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  dateOfBirth: { type: Date }
});

const identityDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // PAN, Aadhaar, Passport, etc.
  filePath: { type: String },
  uploadDate: { type: Date, default: Date.now },
  fileSize: { type: Number },
  mimeType: { type: String },
  identificationNumber: { type: String } // Store the actual ID number
});

// Updated document schema with section support
const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  originalName: { type: String }, // Original filename
  section: { 
    type: String, 
    required: true,
    enum: ['identity', 'education', 'work_experience', 'banking']
  },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileSize: { type: Number },
  mimeType: { type: String },
  fileType: { type: String }, // pdf, doc, docx, etc.
  uploadedBy: { type: String }, // Employee ID who uploaded
  status: { type: String, default: 'active' } // active, deleted
});

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
});

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relationship: String,
  phone: String
});

// Banking information schema
const bankingInfoSchema = new mongoose.Schema({
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  branch: String,
  accountHolderName: String
});

// Main Employee Schema
const employeeSchema = new mongoose.Schema({
  // Core Employee Information
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  
  // Contact Information
  email: { type: String, required: true, unique: true },
  personalEmail: { type: String },
  workPhone: String,
  personalMobile: String,
  phone: String,
  extension: String,
  
  // Work Information
  department: String,
  designation: String,
  role: String,
  zohoRole: String,
  employmentType: { type: String, default: 'Permanent' },
  status: { type: String, default: 'active' },
  employeeStatus: { type: String, default: 'Active' },
  sourceOfHire: { type: String, default: 'Direct' },
  location: String,
  seatingLocation: String,
  reportingManager: String,
  
  // Dates
  dateOfJoining: Date,
  dateOfBirth: Date,
  
  // Personal Information
  firstName: String,
  lastName: String,
  nickName: String,
  maritalStatus: String,
  gender: String,
  aboutMe: String,
  bio: String,
  expertise: String,
  
  // Identity Information
  uan: String,
  pan: String,
  aadhaar: String,
  
  // Banking Information
  bankingInfo: bankingInfoSchema,
  
  // Address Information
  address: addressSchema,
  presentAddress: String,
  permanentAddress: String,
  
  // Emergency Contact
  emergencyContact: emergencyContactSchema,
  
  // Arrays and Complex Data
  skills: [String],
  tags: [String],
  education: [educationSchema],
  workExperience: [workExperienceSchema],
  dependents: [dependentSchema],
  identityDocuments: [identityDocumentSchema],
  documents: [documentSchema], // Updated to use new document schema
  
  // Profile and Media
  profilePhoto: String,
  profilePicture: String,
  
  // System and Authentication
  password: { type: String },
  addedBy: String,
  addedTime: { type: Date, default: Date.now },
  modifiedBy: String,
  modifiedTime: { type: Date, default: Date.now },
  
  // Experience
  totalExperience: String,

  // Document upload status
  documentUploadStatus: {
    identity: { type: Boolean, default: false },
    education: { type: Boolean, default: false },
    work_experience: { type: Boolean, default: false },
    banking: { type: Boolean, default: false }
  }

}, {
  timestamps: true
});

// Virtual for age calculation
employeeSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for full name (from EmployeeProfile)
employeeSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  return this.name;
});

// Virtual to get documents by section
employeeSchema.virtual('documentsBySection').get(function() {
  const sections = {};
  this.documents.forEach(doc => {
    if (!sections[doc.section]) {
      sections[doc.section] = [];
    }
    sections[doc.section].push(doc);
  });
  return sections;
});

// Pre-save middleware to ensure name is populated
employeeSchema.pre('save', function(next) {
  if (!this.name && this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  } else if (!this.name) {
    this.name = this.fullName;
  }
  next();
});

// Method to add documents
employeeSchema.methods.addDocuments = function(documents) {
  this.documents.push(...documents);
  
  // Update document upload status
  documents.forEach(doc => {
    if (this.documentUploadStatus.hasOwnProperty(doc.section)) {
      this.documentUploadStatus[doc.section] = true;
    }
  });
  
  return this.save();
};

// Method to remove document
employeeSchema.methods.removeDocument = function(documentId) {
  const document = this.documents.id(documentId);
  if (!document) {
    throw new Error('Document not found');
  }
  
  this.documents.pull(documentId);
  
  // Update document upload status if no documents left in section
  const section = document.section;
  const hasOtherDocuments = this.documents.some(doc => doc.section === section && doc._id.toString() !== documentId);
  if (!hasOtherDocuments) {
    this.documentUploadStatus[section] = false;
  }
  
  return this.save();
};

// Method to get documents by section
employeeSchema.methods.getDocumentsBySection = function(section) {
  return this.documents.filter(doc => doc.section === section && doc.status === 'active');
};

// Static method to find by employeeId
employeeSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId });
};

// Static method to find active employees
employeeSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find employees by document status
employeeSchema.statics.findByDocumentStatus = function(section, status = true) {
  return this.find({ [`documentUploadStatus.${section}`]: status });
};

// Instance method to get complete profile
employeeSchema.methods.getCompleteProfile = function() {
  return {
    basicInfo: {
      employeeId: this.employeeId,
      name: this.name,
      email: this.email,
      personalEmail: this.personalEmail
    },
    workInfo: {
      department: this.department,
      designation: this.designation,
      role: this.role,
      employmentType: this.employmentType,
      status: this.status,
      dateOfJoining: this.dateOfJoining,
      
    },
    personalInfo: {
      dateOfBirth: this.dateOfBirth,
      age: this.age,
      maritalStatus: this.maritalStatus,
      gender: this.gender
    },
    contactInfo: {
      workPhone: this.workPhone,
      personalMobile: this.personalMobile,
      location: this.location
    },
    documentStatus: this.documentUploadStatus
  };
};

module.exports = mongoose.model('Employee', employeeSchema);