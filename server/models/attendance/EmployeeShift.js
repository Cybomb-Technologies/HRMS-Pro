// models/EmployeeShift.js - Add pre-save hook
const mongoose = require('mongoose');

const employeeShiftSchema = new mongoose.Schema({
  employeeId: { 
    type: String,
    required: true, 
    ref: 'Employee'
  },
  employeeName: {
    type: String,
    required: true
  },
  shiftId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Shift' 
  },
  shiftName: {
    type: String,
    required: true
  },
  effectiveDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  teamId: {
    type: Number,
    default: 1
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

// Pre-save middleware to ensure data consistency
employeeShiftSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Ensure employeeName is always set and matches the employeeId
  if (!this.employeeName || this.employeeName === 'Unknown Employee') {
    try {
      const Employee = require('./Employee');
      const employee = await Employee.findOne({ 
        employeeId: this.employeeId 
      }).select('name');
      
      if (employee) {
        this.employeeName = employee.name;
        console.log(`Auto-populated employeeName for ${this.employeeId}: ${employee.name}`);
      }
    } catch (error) {
      console.error('Error auto-populating employeeName:', error);
    }
  }
  
  // Ensure shiftName is always set
  if (!this.shiftName || this.shiftName === 'Unknown Shift') {
    try {
      const shift = await mongoose.model('Shift').findById(this.shiftId).select('name');
      if (shift) {
        this.shiftName = shift.name;
        console.log(`Auto-populated shiftName for ${this.shiftId}: ${shift.name}`);
      }
    } catch (error) {
      console.error('Error auto-populating shiftName:', error);
    }
  }
  
  next();
});


// Compound index for active assignments
employeeShiftSchema.index({ 
  employeeId: 1, 
  isActive: 1 
});

// Index for effective date queries
employeeShiftSchema.index({ 
  effectiveDate: 1 
});


// Instance method to deactivate assignment
employeeShiftSchema.methods.deactivate = function() {
  this.isActive = false;
  this.endDate = new Date();
  return this.save();
};

// Static method to find active assignments
employeeShiftSchema.statics.findActiveAssignments = function() {
  return this.find({ isActive: true })
    .populate('shiftId')
    .sort({ employeeName: 1 });
};

// Static method to find assignments by employee
employeeShiftSchema.statics.findByEmployee = function(employeeId) {
  return this.find({ employeeId })
    .populate('shiftId')
    .sort({ effectiveDate: -1 });
};

// Static method to find current assignment
employeeShiftSchema.statics.findCurrentAssignment = function(employeeId) {
  return this.findOne({ 
    employeeId, 
    isActive: true 
  }).populate('shiftId');
};

module.exports = mongoose.model('EmployeeShift', employeeShiftSchema);