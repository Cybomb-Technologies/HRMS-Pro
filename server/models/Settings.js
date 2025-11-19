// models/Settings.js
const mongoose = require("mongoose");

// Permission schema for individual modules
const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    accessLevel: {
      type: String,
      enum: ["none", "read-self", "read", "crud"],
      default: "none",
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "India" },
    zipCode: { type: String },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: [permissionSchema],
    isSystem: { type: Boolean, default: false },
    userCount: { type: Number, default: 0 }, // Track how many users have this role
  },
  {
    timestamps: true,
  }
);

// Company Settings Schema (updated with currency details)
const companySettingsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    website: { type: String },
    logo: { type: String },
    address: addressSchema,
    defaultTimezone: { type: String, default: "Asia/Calcutta" },
    defaultCurrency: {
      // FIXED: Store currency as object with all details
      code: { type: String, default: "INR" },
      symbol: { type: String, default: "₹" },
      display: { type: String, default: "INR (₹)" },
      exchangeRate: { type: Number, default: 1 }, // Base rate for INR
    },
    paySchedule: { type: String, default: "Monthly" },
    holidays: [
      {
        id: { type: mongoose.Schema.Types.Mixed },
        name: { type: String, required: true },
        date: { type: Date, required: true },
      },
    ],
    security: {
      twoFactorAuth: { type: Boolean, default: false },
      passwordPolicy: {
        minLength: { type: Number, default: 10 },
        requireUppercase: { type: Boolean, default: true },
        requireLowercase: { type: Boolean, default: true },
        requireNumbers: { type: Boolean, default: true },
        requireSpecialChars: { type: Boolean, default: true },
        rotationDays: { type: Number, default: 90 },
      },
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model("Role", roleSchema);
const CompanySettings = mongoose.model(
  "CompanySettings",
  companySettingsSchema
);

module.exports = { Role, CompanySettings };