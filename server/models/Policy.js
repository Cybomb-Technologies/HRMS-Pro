const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Policy title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Policy category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Policy content is required'],
    trim: true
  },
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

// Index for better search performance
policySchema.index({ title: 'text', content: 'text', category: 1 });
policySchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Policy', policySchema);