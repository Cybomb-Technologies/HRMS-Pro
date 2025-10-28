// models/GeneratedLetter.js
const mongoose = require('mongoose');

const generatedLetterSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfferLetter',
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  formData: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected'],
    default: 'draft'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
generatedLetterSchema.index({ candidateEmail: 1 });
generatedLetterSchema.index({ status: 1 });
generatedLetterSchema.index({ generatedBy: 1 });
generatedLetterSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GeneratedLetter', generatedLetterSchema);