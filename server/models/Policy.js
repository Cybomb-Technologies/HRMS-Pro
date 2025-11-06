const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Policy title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  policyType: {
    type: String,
    required: [true, 'Policy type is required'],
    enum: ['HR', 'Security', 'Operations', 'Compliance', 'IT', 'Other'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Policy category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  content: {
    type: String,
    trim: true
  },
  // NEW FIELDS FOR VISIBILITY
  visibility: {
    type: String,
    required: [true, 'Policy visibility is required'],
    enum: ['ALL', 'SELECTED'], // ALL employees, or SELECTED employee IDs
    default: 'ALL'
  },
  allowedEmployeeIds: [{
    type: String, // Storing employeeId (String) not ObjectId
    trim: true,
    index: true // Index for efficient lookups
  }],
  // Document storage exactly like employee documents
  documents: [{
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    section: { 
      type: String, 
      required: true,
      enum: ['policy'],
      default: 'policy'
    },
    filePath: { type: String },
    uploadDate: { type: Date, default: Date.now },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    fileType: { type: String }, // pdf, doc, docx, etc.
    uploadedBy: { type: String }, // Employee ID who uploaded
    status: { type: String, default: 'active' } // active, deleted
  }],
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual to get active documents
policySchema.virtual('activeDocuments').get(function() {
  return this.documents.filter(doc => doc.status === 'active');
});

// Virtual to get the main policy document
policySchema.virtual('document').get(function() {
  const activeDocs = this.documents.filter(doc => doc.status === 'active');
  return activeDocs.length > 0 ? activeDocs[0] : null;
});

// Method to add documents
policySchema.methods.addDocuments = function(documents) {
  this.documents.push(...documents);
  return this.save();
};

// Method to remove document
policySchema.methods.removeDocument = function(documentId) {
  const document = this.documents.id(documentId);
  if (!document) {
    throw new Error('Document not found');
  }
  
  // Soft delete by setting status to deleted
  document.status = 'deleted';
  return this.save();
};

// Method to get documents by status
policySchema.methods.getDocumentsByStatus = function(status = 'active') {
  return this.documents.filter(doc => doc.status === status);
};

// Ensure virtuals are included in responses
policySchema.set('toJSON', { virtuals: true });
policySchema.set('toObject', { virtuals: true });

// Index for better search performance
policySchema.index({ title: 'text', content: 'text', category: 1, policyType: 1 });
policySchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Policy', policySchema);
