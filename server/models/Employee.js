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

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  filePath: { type: String },
  uploadDate: { type: Date, default: Date.now },
  fileSize: { type: Number },
  mimeType: { type: String }
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
  documents: [documentSchema],
  
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
  totalExperience: String

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

// Pre-save middleware to ensure name is populated
employeeSchema.pre('save', function(next) {
  if (!this.name && this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  } else if (!this.name) {
    this.name = this.fullName;
  }
  next();
});

// Indexes for faster queries
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ location: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'education.instituteName': 1 });
employeeSchema.index({ 'workExperience.companyName': 1 });

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove password from JSON output
    delete ret.password;
    return ret;
  }
});

employeeSchema.set('toObject', { virtuals: true });

// Static method to find by employeeId
employeeSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId });
};

// Static method to find active employees
employeeSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
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
    }
  };
};

module.exports = mongoose.model('Employee', employeeSchema);