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
  templateType: {
    type: String,
    required: true
  },
  trackingId: {
    type: String,
    unique: true,
    default: function() {
      return 'OL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
  },
  candidateName: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true
  },
  candidateEmail: {
    type: String,
    required: [true, 'Candidate email is required'],
    trim: true,
    lowercase: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
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
  sentTo: {
    type: String,
    trim: true
  },
  acceptedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days expiry
      return expiryDate;
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
generatedLetterSchema.index({ trackingId: 1 });
generatedLetterSchema.index({ candidateEmail: 1 });
generatedLetterSchema.index({ status: 1 });
generatedLetterSchema.index({ generatedBy: 1 });
generatedLetterSchema.index({ createdAt: -1 });
generatedLetterSchema.index({ expiresAt: 1 });

// Virtual for isExpired
generatedLetterSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to update status to expired
generatedLetterSchema.methods.checkAndUpdateExpiry = function() {
  if (this.isExpired && this.status === 'sent') {
    this.status = 'expired';
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('GeneratedLetter', generatedLetterSchema);