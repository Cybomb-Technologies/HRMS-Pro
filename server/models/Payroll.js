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
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    allowances: {
      type: Number,
      required: true,
      default: 0,
    },
    deductions: {
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

module.exports = mongoose.model("Payroll", payrollSchema);
