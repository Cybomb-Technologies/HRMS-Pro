// models/Shift.js
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  breakDuration: { 
    type: Number, 
    default: 60 
  },
  description: { 
    type: String,
    trim: true
  },
  teamIds: [{ 
    type: Number 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware
shiftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find active shifts
shiftSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by team
shiftSchema.statics.findByTeam = function(teamId) {
  return this.find({ 
    $or: [
      { teamIds: { $in: [teamId] } },
      { teamIds: { $size: 0 } }
    ],
    isActive: true 
  }).sort({ name: 1 });
};

module.exports = mongoose.model('Shift', shiftSchema);