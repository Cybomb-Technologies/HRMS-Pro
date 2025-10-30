// models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  head: {
    type: String, // Store employeeId as string
    trim: true
  },
  target: {
    type: Number,
    default: 0
  },
  headcount: {
    type: Number,
    default: 0
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
// In Department model
departmentSchema.methods.calculateHeadcount = async function() {
  try {
    const headcount = await Employee.countDocuments({ 
      department: this.name, // or this.departmentId depending on your data structure
      status: 'active'
    });
    
    this.headcount = headcount;
    await this.save();
    return headcount;
  } catch (error) {
    console.error('Error calculating headcount:', error);
    this.headcount = 0;
    await this.save();
    return 0;
  }
};
// Virtual to get head employee details
departmentSchema.virtual('headDetails', {
  ref: 'Employee',
  localField: 'head',
  foreignField: 'employeeId',
  justOne: true
});

// Virtual to get employees in this department
departmentSchema.virtual('employees', {
  ref: 'Employee',
  localField: 'departmentId',
  foreignField: 'department',
  justOne: false
});

// Auto-calculate headcount
departmentSchema.methods.calculateHeadcount = async function() {
  try {
    const count = await mongoose.model('Employee').countDocuments({ 
      department: this.departmentId,
      status: 'active'
    });
    this.headcount = count;
    await this.save();
    return count;
  } catch (error) {
    console.error('Error calculating headcount:', error);
    return this.headcount;
  }
};

// Static method to update all department headcounts
departmentSchema.statics.updateAllHeadcounts = async function() {
  try {
    const departments = await this.find();
    for (const dept of departments) {
      await dept.calculateHeadcount();
    }
    return { success: true, message: 'All headcounts updated' };
  } catch (error) {
    console.error('Error updating all headcounts:', error);
    return { success: false, error: error.message };
  }
};

departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

// Update headcount when employee is saved/updated
departmentSchema.post('save', async function(doc) {
  // Update headcount when department is created or updated
  setTimeout(async () => {
    await doc.calculateHeadcount();
  }, 1000);
});

module.exports = mongoose.model('Department', departmentSchema);