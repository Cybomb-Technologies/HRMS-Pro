// models/OfferLetter.js
const mongoose = require('mongoose');

const offerLetterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  template: {
    type: String,
    required: [true, 'Template content is required']
  },
  templateType: {
    type: String,
    enum: ['professional', 'contract', 'internship', 'word_upload', 'custom'],
    default: 'professional'
  },
  category: {
    type: String,
    enum: ['Full-Time', 'Contract', 'Internship', 'Part-Time', 'Custom'],
    default: 'Full-Time'
  },
  variables: [{
    type: String,
    trim: true
  }],
  originalFileName: {
    type: String
  },
  filePath: {
    type: String
  },
  preview: {
    type: String,
    maxlength: [200, 'Preview cannot exceed 200 characters']
  },
  icon: {
    type: String,
    default: '📄'
  },
  color: {
    type: String,
    default: 'blue'
  },
  isTemplate: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
offerLetterSchema.index({ isActive: 1, isTemplate: 1 });
offerLetterSchema.index({ createdBy: 1 });
offerLetterSchema.index({ category: 1 });

module.exports = mongoose.model('OfferLetter', offerLetterSchema);