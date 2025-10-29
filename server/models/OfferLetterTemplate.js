// models/OfferLetterTemplate.js
const mongoose = require('mongoose');

const offerLetterTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  variables: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Method to generate offer letter
offerLetterTemplateSchema.methods.generateOfferLetter = function(data) {
  let content = this.content;
  
  // Replace all placeholders with actual data
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key] || '';
    content = content.split(placeholder).join(value);
  });
  
  return content;
};

module.exports = mongoose.model('OfferLetterTemplate', offerLetterTemplateSchema);