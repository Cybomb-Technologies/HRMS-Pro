const express = require("express");
const router = express.Router();
const {
  getEmployeesWithSalary,
  runPayroll,
  getPayrollHistory,
  deletePayrollByMonth,
  getLastPayrollRun,
  getPayrollByMonth,
  updatePayrollRecord,
  updateMultiplePayrollRecords,
  rerunPayroll,
  updateEmployeeSalary,
  getEmployeeSalaryHistory,
  generatePayslip,
  getEmployeePayslips, // Import the new function
} = require("../controllers/payrollController");

// Get all employees with their salary info
router.get("/employees", getEmployeesWithSalary);

// Run payroll for a specific month
router.post("/run", runPayroll);

// Get payroll history (all months with payroll)
router.get("/history", getPayrollHistory);

// Delete payroll for a specific month
router.delete("/month/:month/:year", deletePayrollByMonth);

// Get last payroll run
router.get("/last-run", getLastPayrollRun);

// Get payroll details for a specific month
router.get("/month/:month/:year", getPayrollByMonth);

// Update individual payroll record
router.put("/record/:payrollId", updatePayrollRecord);

// Update multiple payroll records
router.put("/records/bulk-update", updateMultiplePayrollRecords);

// Rerun payroll for current month
router.post("/rerun", rerunPayroll);

// Update employee salary
router.post("/salary", updateEmployeeSalary);

// Get employee salary history
router.get("/salary-history/:employeeId", getEmployeeSalaryHistory);

// Generate payslip
router.get("/payslip/:payrollId", generatePayslip);

// NEW: Get employee's own payslips (using same pattern as leave system)
router.get("/employee-payslips/:employeeId", getEmployeePayslips);

module.exports = router;
