// models/Timesheet.js
const mongoose = require('mongoose');

const timesheetEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  project: { type: String, required: true },
  task: { type: String, required: true },
  hours: { type: Number, required: true, min: 0, max: 24 },
  description: { type: String }
});

const timesheetSchema = new mongoose.Schema({
employeeId: { 
  type: String, 
  required: true 
},

  employeeName: { type: String, required: true },
  periodType: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  entries: [timesheetEntrySchema],
  totalHours: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  approverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approverName: { type: String },
  teamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team' 
  },
  comments: { type: String },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  rejectedAt: { type: Date }
}, {
  timestamps: true
});

// Calculate total hours before saving
timesheetSchema.pre('save', function(next) {
  this.totalHours = this.entries.reduce((total, entry) => total + (entry.hours || 0), 0);
  next();
});

// Index for better query performance
timesheetSchema.index({ employeeId: 1, startDate: -1 });
timesheetSchema.index({ status: 1 });
timesheetSchema.index({ teamId: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);
