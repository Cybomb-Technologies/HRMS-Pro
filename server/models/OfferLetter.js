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
    default: ''
  },
  template: {
    type: String,
    required: true
  },
  templateType: {
    type: String,
    enum: ['default', 'word_upload'],
    default: 'default'
  },
  originalFileName: {
    type: String
  },
  filePath: {
    type: String
  },
  variables: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: 'General'
  },
  preview: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Extract variables from template
offerLetterSchema.methods.extractVariables = function() {
  const variableRegex = /{{(\w+)}}/g;
  const matches = this.template.match(variableRegex);
  return matches ? matches.map(match => match.replace(/{{|}}/g, '')) : [];
};

module.exports = mongoose.model('OfferLetter', offerLetterSchema);