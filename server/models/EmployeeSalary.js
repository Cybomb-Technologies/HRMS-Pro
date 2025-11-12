const mongoose = require("mongoose");

const employeeSalarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      ref: "Employee",
    },
    // CTC Information
    ctc: {
      type: Number,
      required: true,
      default: 0,
    },
    // Earnings
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    hra: {
      type: Number,
      required: true,
      default: 0,
    },
    fixedAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    conveyanceAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    childrenEducationAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    medicalAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    shiftAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    mobileInternetAllowance: {
      type: Number,
      required: true,
      default: 0,
    },
    grossEarnings: {
      type: Number,
      required: true,
      default: 0,
    },
    // Deductions
    employeeEPF: {
      type: Number,
      required: true,
      default: 0,
    },
    employeeESI: {
      type: Number,
      required: true,
      default: 0,
    },
    professionalTax: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
      default: 0,
    },
    // Employer Contributions
    employerEPF: {
      type: Number,
      required: true,
      default: 0,
    },
    employerESI: {
      type: Number,
      required: true,
      default: 0,
    },
    netPay: {
      type: Number,
      required: true,
      default: 0,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate derived fields
employeeSalarySchema.pre("save", function (next) {
  // Calculate Gross Earnings
  this.grossEarnings =
    this.basicSalary +
    this.hra +
    this.fixedAllowance +
    this.conveyanceAllowance +
    this.childrenEducationAllowance +
    this.medicalAllowance +
    this.shiftAllowance +
    this.mobileInternetAllowance;

  // Calculate Total Deductions (EPF + ESI + Professional Tax)
  this.totalDeductions =
    this.employeeEPF + this.employeeESI + this.professionalTax;

  // Calculate Net Pay
  this.netPay = this.grossEarnings - this.totalDeductions;

  // Calculate Employer Contributions if not set
  if (this.employerEPF === 0 && this.basicSalary > 0) {
    this.employerEPF = this.basicSalary * 0.12; // 12% of basic salary
  }

  if (this.employerESI === 0 && this.grossEarnings > 0) {
    this.employerESI = this.grossEarnings * 0.0325; // 3.25% of gross earnings
  }

  // Professional Tax remains 0 by default - can be manually set like EPF and ESI

  next();
});

// Index for efficient queries
employeeSalarySchema.index({ employeeId: 1, effectiveFrom: -1 });

module.exports = mongoose.model("EmployeeSalary", employeeSalarySchema);
