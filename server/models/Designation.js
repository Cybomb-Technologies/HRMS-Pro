// models/Designation.js
const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  level: {
    type: String,
    required: true
  },
  department: {
    type: String, // Change from ObjectId to String (departmentId)
    trim: true
  },
  departmentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  description: String,
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

// Virtual to get department details
designationSchema.virtual('departmentDetails', {
  ref: 'Department',
  localField: 'department',
  foreignField: 'departmentId',
  justOne: true
});

designationSchema.set('toJSON', { virtuals: true });
designationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Designation', designationSchema);