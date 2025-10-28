const Employee = require("../models/Employee");
const EmployeeSalary = require("../models/EmployeeSalary");
const Payroll = require("../models/Payroll");

// Helper function to check if a payroll period is the current month
const isCurrentMonthPayroll = (month, year) => {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("en-US", { month: "long" });
  const currentYear = currentDate.getFullYear();

  return month === currentMonth && year === currentYear;
};

// Helper function to get current month and year
const getCurrentMonthYear = () => {
  const currentDate = new Date();
  return {
    month: currentDate.toLocaleString("en-US", { month: "long" }),
    year: currentDate.getFullYear(),
  };
};

// NEW: Sync current month payroll when salary is updated
const syncCurrentMonthPayroll = async (employeeId) => {
  try {
    const current = getCurrentMonthYear();

    // Check if current month payroll exists
    const existingPayroll = await Payroll.findOne({
      employeeId: employeeId,
      month: current.month,
      year: current.year,
    });

    if (existingPayroll) {
      // Get latest salary info
      const salaryInfo = await EmployeeSalary.findOne({
        employeeId: employeeId,
      }).sort({ effectiveFrom: -1 });

      if (salaryInfo) {
        const basicSalary = salaryInfo.basicSalary || 0;
        const allowances = salaryInfo.allowances || 0;
        const deductions = salaryInfo.deductions || 0;
        const netPay = basicSalary + allowances - deductions;

        // Update payroll record with new salary data
        existingPayroll.basicSalary = basicSalary;
        existingPayroll.allowances = allowances;
        existingPayroll.deductions = deductions;
        existingPayroll.netPay = netPay;
        existingPayroll.lastEditedAt = new Date();
        existingPayroll.editedBy = "system-sync";

        await existingPayroll.save();
        console.log(
          `Synced payroll for ${employeeId} for ${current.month} ${current.year}`
        );
      }
    }
  } catch (error) {
    console.error("Error syncing current month payroll:", error);
  }
};

// Get all employees with their salary info
const getEmployeesWithSalary = async (req, res) => {
  try {
    const employees = await Employee.find({ status: "active" });

    const employeesWithSalary = await Promise.all(
      employees.map(async (employee) => {
        const salaryInfo = await EmployeeSalary.findOne({
          employeeId: employee.employeeId,
        }).sort({ effectiveFrom: -1 });

        const basicSalary = salaryInfo?.basicSalary || 0;
        const allowances = salaryInfo?.allowances || 0;
        const deductions = salaryInfo?.deductions || 0;
        const netPay = basicSalary + allowances - deductions;

        return {
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          designation: employee.designation,
          employmentType: employee.employmentType,
          status: employee.status,
          location: employee.location,
          dateOfJoining: employee.dateOfJoining,
          totalExperience: employee.totalExperience,
          basicSalary: basicSalary,
          allowances: allowances,
          deductions: deductions,
          netPay: netPay,
        };
      })
    );

    res.json(employeesWithSalary);
  } catch (error) {
    console.error("Error in getEmployeesWithSalary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Run payroll for a specific month
const runPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const employees = await Employee.find({ status: "active" });
    const payrollResults = [];
    let updatedCount = 0;
    let createdCount = 0;

    // Check if this is current month payroll
    const isCurrentMonth = isCurrentMonthPayroll(month, year);

    for (const employee of employees) {
      const salaryInfo = await EmployeeSalary.findOne({
        employeeId: employee.employeeId,
      }).sort({ effectiveFrom: -1 });

      if (salaryInfo) {
        const basicSalary = salaryInfo.basicSalary || 0;
        const allowances = salaryInfo.allowances || 0;
        const deductions = salaryInfo.deductions || 0;
        const netPay = basicSalary + allowances - deductions;

        const existingPayroll = await Payroll.findOne({
          employeeId: employee.employeeId,
          month,
          year,
        });

        if (!existingPayroll) {
          // Create new payroll record
          const payroll = new Payroll({
            employeeId: employee.employeeId,
            month,
            year,
            basicSalary,
            allowances,
            deductions,
            netPay,
            isCurrentMonth,
            status: "processed",
          });

          await payroll.save();
          payrollResults.push(payroll);
          createdCount++;
        } else {
          // FIXED: Only update salary data if it's the current month
          // For past months, only update status and metadata, preserve original salary amounts
          if (isCurrentMonth) {
            // Current month: Update with latest salary data
            existingPayroll.basicSalary = basicSalary;
            existingPayroll.allowances = allowances;
            existingPayroll.deductions = deductions;
            existingPayroll.netPay = netPay;
          }
          // For both current and past months: Update status and metadata
          existingPayroll.status = "processed";
          existingPayroll.isCurrentMonth = isCurrentMonth;
          existingPayroll.lastEditedAt = new Date();
          existingPayroll.editedBy = req.user?.username || "system";

          await existingPayroll.save();
          payrollResults.push(existingPayroll);
          updatedCount++;
        }
      }
    }

    res.json({
      message: `Payroll processed for ${month} ${year}`,
      payrolls: payrollResults,
      totalEmployees: employees.length,
      processedEmployees: payrollResults.length,
      createdCount,
      updatedCount,
      isCurrentMonth,
    });
  } catch (error) {
    console.error("Error in runPayroll:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to convert month name to numerical value for sorting
const getMonthNumber = (monthName) => {
  const months = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  return months[monthName] || 0;
};

// Get payroll history (all months with payroll)
const getPayrollHistory = async (req, res) => {
  try {
    const payrollHistory = await Payroll.aggregate([
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          count: { $sum: 1 },
          totalNetPay: { $sum: "$netPay" },
          processedDate: { $max: "$createdAt" },
          lastUpdated: { $max: "$updatedAt" },
          isCurrentMonth: { $first: "$isCurrentMonth" },
          status: {
            $push: {
              $cond: {
                if: { $eq: ["$status", "paid"] },
                then: "paid",
                else: "processed",
              },
            },
          },
        },
      },
      {
        $addFields: {
          overallStatus: {
            $cond: {
              if: { $in: ["paid", "$status"] },
              then: {
                $cond: {
                  if: {
                    $eq: [
                      { $size: "$status" },
                      {
                        $size: {
                          $filter: {
                            input: "$status",
                            as: "s",
                            cond: { $eq: ["$$s", "paid"] },
                          },
                        },
                      },
                    ],
                  },
                  then: "paid",
                  else: "mixed",
                },
              },
              else: "processed",
            },
          },
          // Add numerical month and year for sorting
          monthNumber: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id.month", "January"] }, then: 1 },
                { case: { $eq: ["$_id.month", "February"] }, then: 2 },
                { case: { $eq: ["$_id.month", "March"] }, then: 3 },
                { case: { $eq: ["$_id.month", "April"] }, then: 4 },
                { case: { $eq: ["$_id.month", "May"] }, then: 5 },
                { case: { $eq: ["$_id.month", "June"] }, then: 6 },
                { case: { $eq: ["$_id.month", "July"] }, then: 7 },
                { case: { $eq: ["$_id.month", "August"] }, then: 8 },
                { case: { $eq: ["$_id.month", "September"] }, then: 9 },
                { case: { $eq: ["$_id.month", "October"] }, then: 10 },
                { case: { $eq: ["$_id.month", "November"] }, then: 11 },
                { case: { $eq: ["$_id.month", "December"] }, then: 12 },
              ],
              default: 0,
            },
          },
          yearNumber: "$_id.year",
        },
      },
      {
        $sort: {
          yearNumber: -1, // Sort by year descending (2025, 2024, 2023...)
          monthNumber: -1, // Then by month descending within each year (October, September, August... January)
        },
      },
      {
        $project: {
          monthNumber: 0, // Remove temporary fields from final output
          yearNumber: 0,
        },
      },
    ]);

    res.json(payrollHistory || []);
  } catch (error) {
    console.error("Error in getPayrollHistory:", error);
    res.json([]);
  }
};

// Delete payroll for a specific month
const deletePayrollByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    // Check if this is current month payroll (prevent deletion of current month)
    const isCurrentMonth = isCurrentMonthPayroll(month, year);

    if (isCurrentMonth) {
      return res.status(400).json({
        message:
          "Cannot delete current month payroll. Only previous months can be deleted.",
      });
    }

    const result = await Payroll.deleteMany({ month, year });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: `No payroll records found for ${month} ${year}`,
      });
    }

    res.json({
      message: `Successfully deleted ${result.deletedCount} payroll records for ${month} ${year}`,
      deletedCount: result.deletedCount,
      month,
      year,
    });
  } catch (error) {
    console.error("Error in deletePayrollByMonth:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get last payroll run (most recent payroll period)
const getLastPayrollRun = async (req, res) => {
  try {
    const lastPayrollRun = await Payroll.aggregate([
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          count: { $sum: 1 },
          totalNetPay: { $sum: "$netPay" },
          processedDate: { $max: "$createdAt" },
          lastUpdated: { $max: "$updatedAt" },
          isCurrentMonth: { $first: "$isCurrentMonth" },
        },
      },
      {
        $addFields: {
          // Add numerical month and year for sorting
          monthNumber: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id.month", "January"] }, then: 1 },
                { case: { $eq: ["$_id.month", "February"] }, then: 2 },
                { case: { $eq: ["$_id.month", "March"] }, then: 3 },
                { case: { $eq: ["$_id.month", "April"] }, then: 4 },
                { case: { $eq: ["$_id.month", "May"] }, then: 5 },
                { case: { $eq: ["$_id.month", "June"] }, then: 6 },
                { case: { $eq: ["$_id.month", "July"] }, then: 7 },
                { case: { $eq: ["$_id.month", "August"] }, then: 8 },
                { case: { $eq: ["$_id.month", "September"] }, then: 9 },
                { case: { $eq: ["$_id.month", "October"] }, then: 10 },
                { case: { $eq: ["$_id.month", "November"] }, then: 11 },
                { case: { $eq: ["$_id.month", "December"] }, then: 12 },
              ],
              default: 0,
            },
          },
          yearNumber: "$_id.year",
        },
      },
      {
        $sort: {
          yearNumber: -1, // Sort by year descending
          monthNumber: -1, // Then by month descending
        },
      },
      {
        $limit: 1,
      },
    ]);

    if (lastPayrollRun.length === 0) {
      return res.json({
        exists: false,
        message: "No payroll runs found",
      });
    }

    const lastRun = lastPayrollRun[0];

    // Get detailed payroll data for the last run
    const payrollDetails = await Payroll.find({
      month: lastRun._id.month,
      year: lastRun._id.year,
    });

    const payrollsWithEmployeeDetails = await Promise.all(
      payrollDetails.map(async (payroll) => {
        const employee = await Employee.findOne({
          employeeId: payroll.employeeId,
        });
        return {
          _id: payroll._id,
          employeeId: payroll.employeeId,
          employeeDetails: {
            employeeId: employee?.employeeId,
            name: employee?.name,
            email: employee?.email,
            department: employee?.department,
            designation: employee?.designation,
          },
          month: payroll.month,
          year: payroll.year,
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          deductions: payroll.deductions,
          netPay: payroll.netPay,
          status: payroll.status,
          isCurrentMonth: payroll.isCurrentMonth,
        };
      })
    );

    res.json({
      exists: true,
      period: {
        month: lastRun._id.month,
        year: lastRun._id.year,
      },
      summary: {
        employeeCount: lastRun.count,
        totalNetPay: lastRun.totalNetPay,
        processedDate: lastRun.processedDate,
        isCurrentMonth: lastRun.isCurrentMonth,
      },
      payrolls: payrollsWithEmployeeDetails,
    });
  } catch (error) {
    console.error("Error in getLastPayrollRun:", error);
    res.json({ exists: false, message: "Error fetching last payroll run" });
  }
};

// Get payroll details for a specific month
const getPayrollByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;

    const payrolls = await Payroll.find({ month, year });

    if (!payrolls || payrolls.length === 0) {
      return res.json({ payrolls: [], canEdit: false, month, year });
    }

    // Check if this is current month for edit permissions
    const isCurrentMonth = isCurrentMonthPayroll(month, year);

    const payrollsWithEmployeeDetails = await Promise.all(
      payrolls.map(async (payroll) => {
        const employee = await Employee.findOne({
          employeeId: payroll.employeeId,
        });
        return {
          _id: payroll._id,
          employeeId: payroll.employeeId,
          employeeDetails: {
            employeeId: employee?.employeeId,
            name: employee?.name,
            email: employee?.email,
            department: employee?.department,
            designation: employee?.designation,
          },
          month: payroll.month,
          year: payroll.year,
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          deductions: payroll.deductions,
          netPay: payroll.netPay,
          status: payroll.status,
          isCurrentMonth: payroll.isCurrentMonth,
          canEdit: isCurrentMonth,
          lastEditedAt: payroll.lastEditedAt,
          editedBy: payroll.editedBy,
          updatedAt: payroll.updatedAt,
        };
      })
    );

    res.json({
      payrolls: payrollsWithEmployeeDetails,
      canEdit: isCurrentMonth,
      month,
      year,
    });
  } catch (error) {
    console.error("Error in getPayrollByMonth:", error);
    res.json({ payrolls: [], canEdit: false });
  }
};

// Update individual payroll record
const updatePayrollRecord = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { basicSalary, allowances, deductions, status } = req.body;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Check if payroll is editable (current month only)
    const isCurrentMonth = isCurrentMonthPayroll(payroll.month, payroll.year);

    if (!isCurrentMonth) {
      return res.status(400).json({
        message:
          "Cannot edit payroll for previous months. Only current month payroll can be edited.",
      });
    }

    // Validate deductions don't exceed total salary
    const totalSalary = parseFloat(basicSalary) + parseFloat(allowances);
    if (parseFloat(deductions) > totalSalary) {
      return res.status(400).json({
        message: "Deductions cannot exceed total salary (basic + allowances)",
      });
    }

    // FIXED: Also update EmployeeSalary when payroll is updated
    const employeeSalary = await EmployeeSalary.findOne({
      employeeId: payroll.employeeId,
    }).sort({ effectiveFrom: -1 });

    if (employeeSalary) {
      // Update the latest salary record
      employeeSalary.basicSalary = parseFloat(basicSalary);
      employeeSalary.allowances = parseFloat(allowances);
      employeeSalary.deductions = parseFloat(deductions);
      await employeeSalary.save();
    } else {
      // Create new salary record if none exists
      const newSalary = new EmployeeSalary({
        employeeId: payroll.employeeId,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        deductions: parseFloat(deductions),
        effectiveFrom: new Date(),
      });
      await newSalary.save();
    }

    // Update payroll record
    payroll.basicSalary = parseFloat(basicSalary);
    payroll.allowances = parseFloat(allowances);
    payroll.deductions = parseFloat(deductions);
    payroll.netPay = totalSalary - parseFloat(deductions);

    if (status) {
      payroll.status = status;
    }

    payroll.lastEditedAt = new Date();
    payroll.editedBy = req.user?.username || "admin";
    payroll.isCurrentMonth = true;

    await payroll.save();

    // Get updated employee details
    const employee = await Employee.findOne({ employeeId: payroll.employeeId });

    res.json({
      message: "Payroll record and employee salary updated successfully",
      payroll: {
        _id: payroll._id,
        employeeId: payroll.employeeId,
        employeeDetails: {
          name: employee?.name,
          email: employee?.email,
          department: employee?.department,
          designation: employee?.designation,
        },
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        netPay: payroll.netPay,
        status: payroll.status,
        lastEditedAt: payroll.lastEditedAt,
        editedBy: payroll.editedBy,
      },
    });
  } catch (error) {
    console.error("Error in updatePayrollRecord:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update multiple payroll records (bulk update)
const updateMultiplePayrollRecords = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { payrollId, basicSalary, allowances, deductions }

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Updates array is required" });
    }

    const updatedPayrolls = [];
    const errors = [];

    for (const update of updates) {
      try {
        const payroll = await Payroll.findById(update.payrollId);
        if (!payroll) {
          errors.push(`Payroll record not found: ${update.payrollId}`);
          continue;
        }

        // Check if payroll is editable (current month only)
        const isCurrentMonth = isCurrentMonthPayroll(
          payroll.month,
          payroll.year
        );

        if (!isCurrentMonth) {
          errors.push(
            `Cannot edit payroll for previous months: ${payroll.employeeId}`
          );
          continue;
        }

        // Validate deductions don't exceed total salary
        const totalSalary =
          parseFloat(update.basicSalary) + parseFloat(update.allowances);
        if (parseFloat(update.deductions) > totalSalary) {
          errors.push(
            `Deductions exceed total salary for: ${payroll.employeeId}`
          );
          continue;
        }

        // FIXED: Also update EmployeeSalary when payroll is updated
        const employeeSalary = await EmployeeSalary.findOne({
          employeeId: payroll.employeeId,
        }).sort({ effectiveFrom: -1 });

        if (employeeSalary) {
          employeeSalary.basicSalary = parseFloat(update.basicSalary);
          employeeSalary.allowances = parseFloat(update.allowances);
          employeeSalary.deductions = parseFloat(update.deductions);
          await employeeSalary.save();
        } else {
          const newSalary = new EmployeeSalary({
            employeeId: payroll.employeeId,
            basicSalary: parseFloat(update.basicSalary),
            allowances: parseFloat(update.allowances),
            deductions: parseFloat(update.deductions),
            effectiveFrom: new Date(),
          });
          await newSalary.save();
        }

        // Update payroll record
        payroll.basicSalary = parseFloat(update.basicSalary);
        payroll.allowances = parseFloat(update.allowances);
        payroll.deductions = parseFloat(update.deductions);
        payroll.netPay = totalSalary - parseFloat(update.deductions);
        payroll.lastEditedAt = new Date();
        payroll.editedBy = req.user?.username || "admin";

        await payroll.save();

        // Get employee details
        const employee = await Employee.findOne({
          employeeId: payroll.employeeId,
        });

        updatedPayrolls.push({
          _id: payroll._id,
          employeeId: payroll.employeeId,
          employeeDetails: {
            name: employee?.name,
            email: employee?.email,
            department: employee?.department,
            designation: employee?.designation,
          },
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          deductions: payroll.deductions,
          netPay: payroll.netPay,
          status: payroll.status,
          lastEditedAt: payroll.lastEditedAt,
          editedBy: payroll.editedBy,
        });
      } catch (error) {
        errors.push(`Error updating ${update.payrollId}: ${error.message}`);
      }
    }

    res.json({
      message: `Updated ${updatedPayrolls.length} payroll records and employee salaries`,
      updatedPayrolls,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in updateMultiplePayrollRecords:", error);
    res.status(500).json({ message: error.message });
  }
};

// Rerun payroll for current month (update all records with latest salary data)
const rerunPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    // Check if this is current month
    const isCurrentMonth = isCurrentMonthPayroll(month, year);

    if (!isCurrentMonth) {
      return res.status(400).json({
        message:
          "Cannot rerun payroll for previous months. Only current month payroll can be rerun.",
      });
    }

    const employees = await Employee.find({ status: "active" });
    const payrollResults = [];
    let updatedCount = 0;

    for (const employee of employees) {
      const salaryInfo = await EmployeeSalary.findOne({
        employeeId: employee.employeeId,
      }).sort({ effectiveFrom: -1 });

      if (salaryInfo) {
        const basicSalary = salaryInfo.basicSalary || 0;
        const allowances = salaryInfo.allowances || 0;
        const deductions = salaryInfo.deductions || 0;
        const netPay = basicSalary + allowances - deductions;

        const existingPayroll = await Payroll.findOne({
          employeeId: employee.employeeId,
          month,
          year,
        });

        if (existingPayroll) {
          // FIXED: Only update salary data for current month rerun
          // Update existing payroll record with latest salary data
          existingPayroll.basicSalary = basicSalary;
          existingPayroll.allowances = allowances;
          existingPayroll.deductions = deductions;
          existingPayroll.netPay = netPay;
          existingPayroll.status = "processed";
          existingPayroll.isCurrentMonth = true;
          existingPayroll.lastEditedAt = new Date();
          existingPayroll.editedBy = req.user?.username || "system";

          await existingPayroll.save();
          payrollResults.push(existingPayroll);
          updatedCount++;
        }
      }
    }

    res.json({
      message: `Payroll rerun for ${month} ${year}`,
      payrolls: payrollResults,
      totalEmployees: employees.length,
      updatedCount,
      isCurrentMonth: true,
    });
  } catch (error) {
    console.error("Error in rerunPayroll:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update employee salary - MODIFIED: Added sync to current month payroll
const updateEmployeeSalary = async (req, res) => {
  try {
    const { employeeId, basicSalary, allowances, deductions, effectiveFrom } =
      req.body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const salaryRecord = new EmployeeSalary({
      employeeId,
      basicSalary: parseFloat(basicSalary) || 0,
      allowances: parseFloat(allowances) || 0,
      deductions: parseFloat(deductions) || 0,
      effectiveFrom: effectiveFrom || new Date(),
    });

    await salaryRecord.save();

    // NEW: Sync current month payroll if it exists
    await syncCurrentMonthPayroll(employeeId);

    res.json({
      message: "Salary updated successfully",
      salaryRecord,
      employee: {
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (error) {
    console.error("Error in updateEmployeeSalary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get employee salary history
const getEmployeeSalaryHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const salaryHistory = await EmployeeSalary.find({ employeeId }).sort({
      effectiveFrom: -1,
    });

    res.json(salaryHistory);
  } catch (error) {
    console.error("Error in getEmployeeSalaryHistory:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate payslip
const generatePayslip = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    const employee = await Employee.findOne({
      employeeId: payroll.employeeId,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const payslipData = {
      employeeName: employee.name,
      employeeId: employee.employeeId,
      department: employee.department,
      designation: employee.designation,
      employmentType: employee.employmentType,
      location: employee.location,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      netPay: payroll.netPay,
      generatedDate: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    res.json(payslipData);
  } catch (error) {
    console.error("Error in generatePayslip:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
  syncCurrentMonthPayroll, // Export the new function
};
