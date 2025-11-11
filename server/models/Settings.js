// models/Settings.js
const mongoose = require('mongoose');

// Permission schema for individual modules
const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  accessLevel: { 
    type: String, 
    enum: ['none', 'read-self', 'read', 'crud'],
    default: 'none'
  }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [permissionSchema],
  isSystem: { type: Boolean, default: false },
  userCount: { type: Number, default: 0 } // Track how many users have this role
}, { 
  timestamps: true
});

// Company Settings Schema (unchanged)
const companySettingsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  website: { type: String },
  logo: { type: String },
  defaultTimezone: { type: String, default: '(GMT-05:00) Eastern Time' },
  defaultCurrency: { type: String, default: 'USD ($)' },
  paySchedule: { type: String, default: 'Monthly' },
  holidays: [{
    id: { type: mongoose.Schema.Types.Mixed },
    name: { type: String, required: true },
    date: { type: Date, required: true }
  }],
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    passwordPolicy: {
      minLength: { type: Number, default: 10 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: true },
      rotationDays: { type: Number, default: 90 }
    }
  }
}, { 
  timestamps: true
});

const Role = mongoose.model('Role', roleSchema);
const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = { Role, CompanySettings };