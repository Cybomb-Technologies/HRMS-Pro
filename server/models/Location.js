// models/Location.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: String,
  city: String,
  state: String,
  country: {
    type: String,
    default: 'United States'
  },
  postalCode: String,
  timezone: {
    type: String,
    default: 'UTC'
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

module.exports = mongoose.model('Location', locationSchema);