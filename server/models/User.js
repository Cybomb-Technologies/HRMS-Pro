// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  personalEmail: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['employee', 'hr', 'admin', 'employer'],
    default: 'employee'
  },
  adminId: { type: String },
  hrId: { type: String },
  employeeId: { type: String },
  roles: [{ type: String }],
  teamId: { type: Number, default: 1 },
  department: String,
  position: String,
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  // 2FA Fields
  twoFactorEnabled: { type: Boolean, default: true },
  twoFactorSecret: { type: String },
  twoFactorSetupCompleted: { type: Boolean, default: false }, // NEW: Track if setup is completed
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  hireDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);