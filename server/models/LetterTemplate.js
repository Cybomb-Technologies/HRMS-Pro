const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Letter Template Schema
const letterTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LetterCategory',
    required: [true, 'Category is required']
  },

  file: {
    fileId: mongoose.Schema.Types.ObjectId,
    fileName: String,
    fileSize: Number,
    fileType: String,
    uploadDate: { type: Date, default: Date.now }
  },

  downloadCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

letterTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

letterTemplateSchema.set('toJSON', { virtuals: true });
letterTemplateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LetterTemplate', letterTemplateSchema);
