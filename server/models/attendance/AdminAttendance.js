// models/attendance/AdminAttendance.js
const mongoose = require('mongoose');

const adminAttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  totalHours: {
    type: Number
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
    default: 'absent'
  },
  checkInLocation: {
    type: String
  },
  teamId: {
    type: Number
  }
}, {
  timestamps: true
});

// Create compound index for better query performance
adminAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
adminAttendanceSchema.index({ date: 1 });
adminAttendanceSchema.index({ status: 1 });

// Change the model name to avoid conflict
module.exports = mongoose.model('AdminAttendance', adminAttendanceSchema);