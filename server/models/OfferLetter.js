// models/OfferLetter.js
const mongoose = require('mongoose');

const offerLetterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
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
  variables: [{
    type: String
  }]
}, {
  timestamps: true
});

// Static method to extract variables from template
offerLetterSchema.statics.extractVariables = function(template) {
  const variableRegex = /{{(\w+)}}/g;
  const matches = [];
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    matches.push(match[1]);
  }
  
  return [...new Set(matches)]; // Return unique variables
};

// Pre-save middleware to update variables
offerLetterSchema.pre('save', function(next) {
  if (this.isModified('template')) {
    this.variables = this.constructor.extractVariables(this.template);
  }
  next();
});

// Index for better query performance
offerLetterSchema.index({ isActive: 1 });
offerLetterSchema.index({ createdBy: 1 });

module.exports = mongoose.model('OfferLetter', offerLetterSchema);