const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      ref: "Employee",
    },
    month: {
      type: String,
      required: true,
      enum: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    },
    year: {
      type: Number,
      required: true,
    },
    // NEW: Store currency at time of payroll processing
    currency: {
      code: {
        type: String,
        required: true,
        default: "INR",
      },
      symbol: {
        type: String,
        required: true,
        default: "₹",
      },
      display: {
        type: String,
        required: true,
        default: "INR (₹)",
      },
      exchangeRate: {
        type: Number,
        required: true,
        default: 1,
      },
    },
    // NEW: Store company details at time of payroll processing
    companyDetails: {
      name: {
        type: String,
        required: true,
        default: "Cybomb Technologies Pvt Ltd",
      },
      logo: {
        type: String,
        default: "",
      },
      address: {
        street: {
          type: String,
          default: "Prime Plaza No.54/1, 1st street, Sripuram colony",
        },
        city: {
          type: String,
          default: "Chennai",
        },
        state: {
          type: String,
          default: "Tamil Nadu",
        },
        zipCode: {
          type: String,
          default: "600 016",
        },
        country: {
          type: String,
          default: "India",
        },
      },
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
    // CTC & Employer Contributions
    ctc: {
      type: Number,
      required: true,
      default: 0,
    },
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
    status: {
      type: String,
      enum: ["pending", "processed", "paid"],
      default: "processed",
    },
    isCurrentMonth: {
      type: Boolean,
      default: false,
    },
    lastEditedAt: {
      type: Date,
      default: null,
    },
    editedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure unique payroll per employee per month
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Virtual for checking if payroll is editable (current month)
payrollSchema.virtual("isEditable").get(function () {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("en-US", { month: "long" });
  const currentYear = currentDate.getFullYear();

  return this.month === currentMonth && this.year === currentYear;
});

// Pre-save middleware to calculate derived fields
payrollSchema.pre("save", function (next) {
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

  next();
});

module.exports = mongoose.model("Payroll", payrollSchema);
