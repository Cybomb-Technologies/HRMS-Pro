// models/AttendanceReport.js
const mongoose = require('mongoose');

const attendanceReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  filters: {
    teamIds: [Number],
    departments: [String],
    statuses: [String]
  },
  generatedBy: {
    type: String,
    required: true
  },
  generatedByName: {
    type: String,
    required: true
  },
  data: mongoose.Schema.Types.Mixed, // Store report data
  filePath: String, // Path to exported file
  downloadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for report queries
attendanceReportSchema.index({ 
  reportType: 1, 
  startDate: -1 
});

attendanceReportSchema.index({ 
  generatedBy: 1, 
  createdAt: -1 
});

module.exports = mongoose.model('AttendanceReport', attendanceReportSchema);