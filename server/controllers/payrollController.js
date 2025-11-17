const Employee = require("../models/Employee");
const EmployeeSalary = require("../models/EmployeeSalary");
const Payroll = require("../models/Payroll");
const CompanySettings = require("../models/Settings").CompanySettings;

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

// NEW: Get current company currency settings
const getCurrentCurrency = async () => {
  try {
    const companySettings = await CompanySettings.findOne({});
    if (companySettings && companySettings.defaultCurrency) {
      return companySettings.defaultCurrency;
    }
    // Default currency if none set
    return {
      code: "INR",
      symbol: "₹",
      display: "INR (₹)",
      exchangeRate: 1,
    };
  } catch (error) {
    console.error("Error getting current currency:", error);
    return {
      code: "INR",
      symbol: "₹",
      display: "INR (₹)",
      exchangeRate: 1,
    };
  }
};

// NEW: Get current company details
const getCurrentCompanyDetails = async () => {
  try {
    const companySettings = await CompanySettings.findOne({});
    if (companySettings) {
      return {
        name: companySettings.name || "Cybomb Technologies Pvt Ltd",
        logo: companySettings.logo || "",
        address: {
          street:
            companySettings.address?.street ||
            "Prime Plaza No.54/1, 1st street, Sripuram colony",
          city: companySettings.address?.city || "Chennai",
          state: companySettings.address?.state || "Tamil Nadu",
          zipCode: companySettings.address?.zipCode || "600 016",
          country: companySettings.address?.country || "India",
        },
      };
    }
    // Default company details
    return {
      name: "Cybomb Technologies Pvt Ltd",
      logo: "",
      address: {
        street: "Prime Plaza No.54/1, 1st street, Sripuram colony",
        city: "Chennai",
        state: "Tamil Nadu",
        zipCode: "600 016",
        country: "India",
      },
    };
  } catch (error) {
    console.error("Error getting current company details:", error);
    return {
      name: "Cybomb Technologies Pvt Ltd",
      logo: "",
      address: {
        street: "Prime Plaza No.54/1, 1st street, Sripuram colony",
        city: "Chennai",
        state: "Tamil Nadu",
        zipCode: "600 016",
        country: "India",
      },
    };
  }
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
        // Update payroll record with new salary data
        existingPayroll.basicSalary = salaryInfo.basicSalary || 0;
        existingPayroll.hra = salaryInfo.hra || 0;
        existingPayroll.fixedAllowance = salaryInfo.fixedAllowance || 0;
        existingPayroll.conveyanceAllowance =
          salaryInfo.conveyanceAllowance || 0;
        existingPayroll.childrenEducationAllowance =
          salaryInfo.childrenEducationAllowance || 0;
        existingPayroll.medicalAllowance = salaryInfo.medicalAllowance || 0;
        existingPayroll.shiftAllowance = salaryInfo.shiftAllowance || 0;
        existingPayroll.mobileInternetAllowance =
          salaryInfo.mobileInternetAllowance || 0;
        existingPayroll.grossEarnings = salaryInfo.grossEarnings || 0;
        existingPayroll.employeeEPF = salaryInfo.employeeEPF || 0;
        existingPayroll.employeeESI = salaryInfo.employeeESI || 0;
        existingPayroll.professionalTax = salaryInfo.professionalTax || 0;
        existingPayroll.totalDeductions = salaryInfo.totalDeductions || 0;
        existingPayroll.ctc = salaryInfo.ctc || 0;
        existingPayroll.employerEPF = salaryInfo.employerEPF || 0;
        existingPayroll.employerESI = salaryInfo.employerESI || 0;
        existingPayroll.netPay = salaryInfo.netPay || 0;
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

// Calculate salary components from CTC - RENAMED THIS FUNCTION
const calculateSalaryComponentsFromCTC = (ctc) => {
  const monthlyCTC = ctc / 12;

  // Standard salary structure percentages
  const basicPercentage = 0.5; // 50% of CTC for basic
  const hraPercentage = 0.2; // 20% of basic for HRA
  const fixedAllowancePercentage = 0.15; // 15% of CTC for fixed allowance

  const basicSalary = monthlyCTC * basicPercentage;
  const hra = basicSalary * hraPercentage;
  const fixedAllowance = monthlyCTC * fixedAllowancePercentage;

  // Remaining distributed to other allowances
  const remaining = monthlyCTC - (basicSalary + hra + fixedAllowance);

  return {
    basicSalary: Math.round(basicSalary),
    hra: Math.round(hra),
    fixedAllowance: Math.round(fixedAllowance),
    conveyanceAllowance: Math.round(remaining * 0.15),
    childrenEducationAllowance: Math.round(remaining * 0.1),
    medicalAllowance: Math.round(remaining * 0.1),
    shiftAllowance: Math.round(remaining * 0.25),
    mobileInternetAllowance: Math.round(remaining * 0.4),
    employeeEPF: Math.round(basicSalary * 0.12), // 12% of basic
    employeeESI: Math.round(monthlyCTC * 0.0075), // 0.75% of gross
    professionalTax: 0, // Professional Tax is 0 by default - can be manually set
    employerEPF: Math.round(basicSalary * 0.12), // 12% of basic
    employerESI: Math.round(monthlyCTC * 0.0325), // 3.25% of gross
  };
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
          // Salary Details - RETURN NUMERIC VALUES ONLY
          ctc: salaryInfo?.ctc || 0,
          // Earnings
          basicSalary: salaryInfo?.basicSalary || 0,
          hra: salaryInfo?.hra || 0,
          fixedAllowance: salaryInfo?.fixedAllowance || 0,
          conveyanceAllowance: salaryInfo?.conveyanceAllowance || 0,
          childrenEducationAllowance:
            salaryInfo?.childrenEducationAllowance || 0,
          medicalAllowance: salaryInfo?.medicalAllowance || 0,
          shiftAllowance: salaryInfo?.shiftAllowance || 0,
          mobileInternetAllowance: salaryInfo?.mobileInternetAllowance || 0,
          grossEarnings: salaryInfo?.grossEarnings || 0,
          // Deductions
          employeeEPF: salaryInfo?.employeeEPF || 0,
          employeeESI: salaryInfo?.employeeESI || 0,
          professionalTax: salaryInfo?.professionalTax || 0,
          totalDeductions: salaryInfo?.totalDeductions || 0,
          // Net Pay - NUMERIC VALUE ONLY
          netPay: salaryInfo?.netPay || 0,
        };
      })
    );

    res.json(employeesWithSalary);
  } catch (error) {
    console.error("Error in getEmployeesWithSalary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Run payroll for a specific month (all employees or selected employees)
const runPayroll = async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    let employees;
    if (employeeIds && employeeIds.length > 0) {
      // Run payroll for selected employees only
      employees = await Employee.find({
        employeeId: { $in: employeeIds },
        status: "active",
      });
    } else {
      // Run payroll for all active employees
      employees = await Employee.find({ status: "active" });
    }

    if (employees.length === 0) {
      return res
        .status(400)
        .json({ message: "No employees found to process payroll" });
    }

    // NEW: Get current currency at time of payroll processing
    const currentCurrency = await getCurrentCurrency();
    // NEW: Get current company details at time of payroll processing
    const currentCompanyDetails = await getCurrentCompanyDetails();

    const payrollResults = [];
    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    // Check if this is current month payroll
    const isCurrentMonth = isCurrentMonthPayroll(month, year);

    for (const employee of employees) {
      const salaryInfo = await EmployeeSalary.findOne({
        employeeId: employee.employeeId,
      }).sort({ effectiveFrom: -1 });

      if (salaryInfo) {
        const existingPayroll = await Payroll.findOne({
          employeeId: employee.employeeId,
          month,
          year,
        });

        if (!existingPayroll) {
          // Create new payroll record with current currency AND company details
          const payroll = new Payroll({
            employeeId: employee.employeeId,
            month,
            year,
            // NEW: Store currency at time of processing
            currency: currentCurrency,
            // NEW: Store company details at time of processing
            companyDetails: currentCompanyDetails,
            // CTC
            ctc: salaryInfo.ctc || 0,
            // Earnings
            basicSalary: salaryInfo.basicSalary || 0,
            hra: salaryInfo.hra || 0,
            fixedAllowance: salaryInfo.fixedAllowance || 0,
            conveyanceAllowance: salaryInfo.conveyanceAllowance || 0,
            childrenEducationAllowance:
              salaryInfo.childrenEducationAllowance || 0,
            medicalAllowance: salaryInfo.medicalAllowance || 0,
            shiftAllowance: salaryInfo.shiftAllowance || 0,
            mobileInternetAllowance: salaryInfo.mobileInternetAllowance || 0,
            grossEarnings: salaryInfo.grossEarnings || 0,
            // Deductions
            employeeEPF: salaryInfo.employeeEPF || 0,
            employeeESI: salaryInfo.employeeESI || 0,
            professionalTax: salaryInfo.professionalTax || 0,
            totalDeductions: salaryInfo.totalDeductions || 0,
            // Employer Contributions
            employerEPF: salaryInfo.employerEPF || 0,
            employerESI: salaryInfo.employerESI || 0,
            netPay: salaryInfo.netPay || 0,
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
            // Current month: Update with latest salary data AND current currency AND company details
            existingPayroll.currency = currentCurrency;
            existingPayroll.companyDetails = currentCompanyDetails;
            existingPayroll.ctc = salaryInfo.ctc || 0;
            existingPayroll.basicSalary = salaryInfo.basicSalary || 0;
            existingPayroll.hra = salaryInfo.hra || 0;
            existingPayroll.fixedAllowance = salaryInfo.fixedAllowance || 0;
            existingPayroll.conveyanceAllowance =
              salaryInfo.conveyanceAllowance || 0;
            existingPayroll.childrenEducationAllowance =
              salaryInfo.childrenEducationAllowance || 0;
            existingPayroll.medicalAllowance = salaryInfo.medicalAllowance || 0;
            existingPayroll.shiftAllowance = salaryInfo.shiftAllowance || 0;
            existingPayroll.mobileInternetAllowance =
              salaryInfo.mobileInternetAllowance || 0;
            existingPayroll.grossEarnings = salaryInfo.grossEarnings || 0;
            existingPayroll.employeeEPF = salaryInfo.employeeEPF || 0;
            existingPayroll.employeeESI = salaryInfo.employeeESI || 0;
            existingPayroll.professionalTax = salaryInfo.professionalTax || 0;
            existingPayroll.totalDeductions = salaryInfo.totalDeductions || 0;
            existingPayroll.employerEPF = salaryInfo.employerEPF || 0;
            existingPayroll.employerESI = salaryInfo.employerESI || 0;
            existingPayroll.netPay = salaryInfo.netPay || 0;
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
      } else {
        skippedCount++;
      }
    }

    res.json({
      message: `Payroll processed for ${month} ${year}`,
      payrolls: payrollResults,
      totalEmployees: employees.length,
      processedEmployees: payrollResults.length,
      createdCount,
      updatedCount,
      skippedCount,
      isCurrentMonth,
      currency: currentCurrency, // Return currency used for this payroll run
      companyDetails: currentCompanyDetails, // Return company details used for this payroll run
      processedEmployeeIds: payrollResults.map((p) => p.employeeId),
    });
  } catch (error) {
    console.error("Error in runPayroll:", error);
    res.status(500).json({ message: error.message });
  }
};

// NEW: Run payroll for individual employee - MODIFIED: Return consistent response format
const runIndividualPayroll = async (req, res) => {
  try {
    const { month, year, employeeId } = req.body;

    if (!month || !year || !employeeId) {
      return res.status(400).json({
        message: "Month, year and employee ID are required",
      });
    }

    const employee = await Employee.findOne({
      employeeId: employeeId,
      status: "active",
    });

    if (!employee) {
      return res
        .status(404)
        .json({ message: "Employee not found or inactive" });
    }

    const salaryInfo = await EmployeeSalary.findOne({
      employeeId: employee.employeeId,
    }).sort({ effectiveFrom: -1 });

    if (!salaryInfo) {
      return res.status(400).json({
        message: `No salary information found for employee ${employeeId}`,
      });
    }

    // NEW: Get current currency at time of payroll processing
    const currentCurrency = await getCurrentCurrency();
    // NEW: Get current company details at time of payroll processing
    const currentCompanyDetails = await getCurrentCompanyDetails();

    // Check if this is current month payroll
    const isCurrentMonth = isCurrentMonthPayroll(month, year);

    const existingPayroll = await Payroll.findOne({
      employeeId: employee.employeeId,
      month,
      year,
    });

    let payroll;
    let action = "";

    if (!existingPayroll) {
      // Create new payroll record with current currency AND company details
      payroll = new Payroll({
        employeeId: employee.employeeId,
        month,
        year,
        // NEW: Store currency at time of processing
        currency: currentCurrency,
        // NEW: Store company details at time of processing
        companyDetails: currentCompanyDetails,
        // CTC
        ctc: salaryInfo.ctc || 0,
        // Earnings
        basicSalary: salaryInfo.basicSalary || 0,
        hra: salaryInfo.hra || 0,
        fixedAllowance: salaryInfo.fixedAllowance || 0,
        conveyanceAllowance: salaryInfo.conveyanceAllowance || 0,
        childrenEducationAllowance: salaryInfo.childrenEducationAllowance || 0,
        medicalAllowance: salaryInfo.medicalAllowance || 0,
        shiftAllowance: salaryInfo.shiftAllowance || 0,
        mobileInternetAllowance: salaryInfo.mobileInternetAllowance || 0,
        grossEarnings: salaryInfo.grossEarnings || 0,
        // Deductions
        employeeEPF: salaryInfo.employeeEPF || 0,
        employeeESI: salaryInfo.employeeESI || 0,
        professionalTax: salaryInfo.professionalTax || 0,
        totalDeductions: salaryInfo.totalDeductions || 0,
        // Employer Contributions
        employerEPF: salaryInfo.employerEPF || 0,
        employerESI: salaryInfo.employerESI || 0,
        netPay: salaryInfo.netPay || 0,
        isCurrentMonth,
        status: "processed",
      });

      await payroll.save();
      action = "created";
    } else {
      // Update existing payroll
      if (isCurrentMonth) {
        // Current month: Update with latest salary data AND current currency AND company details
        existingPayroll.currency = currentCurrency;
        existingPayroll.companyDetails = currentCompanyDetails;
        existingPayroll.ctc = salaryInfo.ctc || 0;
        existingPayroll.basicSalary = salaryInfo.basicSalary || 0;
        existingPayroll.hra = salaryInfo.hra || 0;
        existingPayroll.fixedAllowance = salaryInfo.fixedAllowance || 0;
        existingPayroll.conveyanceAllowance =
          salaryInfo.conveyanceAllowance || 0;
        existingPayroll.childrenEducationAllowance =
          salaryInfo.childrenEducationAllowance || 0;
        existingPayroll.medicalAllowance = salaryInfo.medicalAllowance || 0;
        existingPayroll.shiftAllowance = salaryInfo.shiftAllowance || 0;
        existingPayroll.mobileInternetAllowance =
          salaryInfo.mobileInternetAllowance || 0;
        existingPayroll.grossEarnings = salaryInfo.grossEarnings || 0;
        existingPayroll.employeeEPF = salaryInfo.employeeEPF || 0;
        existingPayroll.employeeESI = salaryInfo.employeeESI || 0;
        existingPayroll.professionalTax = salaryInfo.professionalTax || 0;
        existingPayroll.totalDeductions = salaryInfo.totalDeductions || 0;
        existingPayroll.employerEPF = salaryInfo.employerEPF || 0;
        existingPayroll.employerESI = salaryInfo.employerESI || 0;
        existingPayroll.netPay = salaryInfo.netPay || 0;
      }
      existingPayroll.status = "processed";
      existingPayroll.isCurrentMonth = isCurrentMonth;
      existingPayroll.lastEditedAt = new Date();
      existingPayroll.editedBy = req.user?.username || "system";

      await existingPayroll.save();
      payroll = existingPayroll;
      action = "updated";
    }

    // MODIFIED: Return consistent response format for frontend
    res.json({
      message: `Payroll ${action} for employee ${employeeId} for ${month} ${year}`,
      payroll,
      action,
      employee: {
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      },
      isCurrentMonth,
      currency: currentCurrency, // Return currency used for this payroll run
      companyDetails: currentCompanyDetails, // Return company details used for this payroll run
      // ADDED: Return counts for consistent frontend handling
      totalEmployees: 1,
      processedEmployees: 1,
      createdCount: action === "created" ? 1 : 0,
      updatedCount: action === "updated" ? 1 : 0,
      skippedCount: 0,
    });
  } catch (error) {
    console.error("Error in runIndividualPayroll:", error);
    res.status(500).json({ message: error.message });
  }
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
          totalCTC: { $sum: "$ctc" },
          totalGrossEarnings: { $sum: "$grossEarnings" },
          processedDate: { $max: "$createdAt" },
          lastUpdated: { $max: "$updatedAt" },
          isCurrentMonth: { $first: "$isCurrentMonth" },
          // NEW: Include currency information
          currency: { $first: "$currency" },
          // NEW: Include company details
          companyDetails: { $first: "$companyDetails" },
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
          totalCTC: { $sum: "$ctc" },
          totalGrossEarnings: { $sum: "$grossEarnings" },
          processedDate: { $max: "$createdAt" },
          lastUpdated: { $max: "$updatedAt" },
          isCurrentMonth: { $first: "$isCurrentMonth" },
          // NEW: Include currency information
          currency: { $first: "$currency" },
          // NEW: Include company details
          companyDetails: { $first: "$companyDetails" },
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
          // NEW: Include stored currency
          currency: payroll.currency,
          // NEW: Include stored company details
          companyDetails: payroll.companyDetails,
          // CTC
          ctc: payroll.ctc,
          // Earnings
          basicSalary: payroll.basicSalary,
          hra: payroll.hra,
          fixedAllowance: payroll.fixedAllowance,
          conveyanceAllowance: payroll.conveyanceAllowance,
          childrenEducationAllowance: payroll.childrenEducationAllowance,
          medicalAllowance: payroll.medicalAllowance,
          shiftAllowance: payroll.shiftAllowance,
          mobileInternetAllowance: payroll.mobileInternetAllowance,
          grossEarnings: payroll.grossEarnings,
          // Deductions
          employeeEPF: payroll.employeeEPF,
          employeeESI: payroll.employeeESI,
          professionalTax: payroll.professionalTax,
          totalDeductions: payroll.totalDeductions,
          // Net Pay - NUMERIC VALUE ONLY
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
        totalCTC: lastRun.totalCTC,
        totalGrossEarnings: lastRun.totalGrossEarnings,
        processedDate: lastRun.processedDate,
        isCurrentMonth: lastRun.isCurrentMonth,
        // NEW: Include currency in summary
        currency: lastRun.currency,
        // NEW: Include company details in summary
        companyDetails: lastRun.companyDetails,
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
          // NEW: Include stored currency
          currency: payroll.currency,
          // NEW: Include stored company details
          companyDetails: payroll.companyDetails,
          // CTC
          ctc: payroll.ctc,
          // Earnings
          basicSalary: payroll.basicSalary,
          hra: payroll.hra,
          fixedAllowance: payroll.fixedAllowance,
          conveyanceAllowance: payroll.conveyanceAllowance,
          childrenEducationAllowance: payroll.childrenEducationAllowance,
          medicalAllowance: payroll.medicalAllowance,
          shiftAllowance: payroll.shiftAllowance,
          mobileInternetAllowance: payroll.mobileInternetAllowance,
          grossEarnings: payroll.grossEarnings,
          // Deductions
          employeeEPF: payroll.employeeEPF,
          employeeESI: payroll.employeeESI,
          professionalTax: payroll.professionalTax,
          totalDeductions: payroll.totalDeductions,
          // Net Pay - NUMERIC VALUE ONLY
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
    const {
      ctc,
      basicSalary,
      hra,
      fixedAllowance,
      conveyanceAllowance,
      childrenEducationAllowance,
      medicalAllowance,
      shiftAllowance,
      mobileInternetAllowance,
      employeeEPF,
      employeeESI,
      professionalTax,
      status,
    } = req.body;

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

    // NEW: Get current currency for current month edits
    const currentCurrency = await getCurrentCurrency();
    // NEW: Get current company details for current month edits
    const currentCompanyDetails = await getCurrentCompanyDetails();

    // Calculate gross earnings
    const grossEarnings =
      parseFloat(basicSalary) +
      parseFloat(hra) +
      parseFloat(fixedAllowance) +
      parseFloat(conveyanceAllowance) +
      parseFloat(childrenEducationAllowance) +
      parseFloat(medicalAllowance) +
      parseFloat(shiftAllowance) +
      parseFloat(mobileInternetAllowance);

    // Calculate total deductions (EPF + ESI + Professional Tax)
    const totalDeductions =
      parseFloat(employeeEPF) +
      parseFloat(employeeESI) +
      parseFloat(professionalTax);

    // Validate deductions don't exceed total salary
    if (totalDeductions > grossEarnings) {
      return res.status(400).json({
        message: "Total deductions cannot exceed gross earnings",
      });
    }

    // FIXED: Also update EmployeeSalary when payroll is updated
    const employeeSalary = await EmployeeSalary.findOne({
      employeeId: payroll.employeeId,
    }).sort({ effectiveFrom: -1 });

    if (employeeSalary) {
      // Update the latest salary record
      employeeSalary.ctc = parseFloat(ctc);
      employeeSalary.basicSalary = parseFloat(basicSalary);
      employeeSalary.hra = parseFloat(hra);
      employeeSalary.fixedAllowance = parseFloat(fixedAllowance);
      employeeSalary.conveyanceAllowance = parseFloat(conveyanceAllowance);
      employeeSalary.childrenEducationAllowance = parseFloat(
        childrenEducationAllowance
      );
      employeeSalary.medicalAllowance = parseFloat(medicalAllowance);
      employeeSalary.shiftAllowance = parseFloat(shiftAllowance);
      employeeSalary.mobileInternetAllowance = parseFloat(
        mobileInternetAllowance
      );
      employeeSalary.employeeEPF = parseFloat(employeeEPF);
      employeeSalary.employeeESI = parseFloat(employeeESI);
      employeeSalary.professionalTax = parseFloat(professionalTax);
      employeeSalary.grossEarnings = grossEarnings;
      employeeSalary.totalDeductions = totalDeductions;
      employeeSalary.netPay = grossEarnings - totalDeductions;

      // Calculate employer contributions
      employeeSalary.employerEPF = employeeSalary.basicSalary * 0.12;
      employeeSalary.employerESI = employeeSalary.grossEarnings * 0.0325;

      await employeeSalary.save();
    } else {
      // Create new salary record if none exists
      const newSalary = new EmployeeSalary({
        employeeId: payroll.employeeId,
        ctc: parseFloat(ctc),
        basicSalary: parseFloat(basicSalary),
        hra: parseFloat(hra),
        fixedAllowance: parseFloat(fixedAllowance),
        conveyanceAllowance: parseFloat(conveyanceAllowance),
        childrenEducationAllowance: parseFloat(childrenEducationAllowance),
        medicalAllowance: parseFloat(medicalAllowance),
        shiftAllowance: parseFloat(shiftAllowance),
        mobileInternetAllowance: parseFloat(mobileInternetAllowance),
        employeeEPF: parseFloat(employeeEPF),
        employeeESI: parseFloat(employeeESI),
        professionalTax: parseFloat(professionalTax),
        grossEarnings: grossEarnings,
        totalDeductions: totalDeductions,
        netPay: grossEarnings - totalDeductions,
        employerEPF: parseFloat(basicSalary) * 0.12,
        employerESI: grossEarnings * 0.0325,
        effectiveFrom: new Date(),
      });
      await newSalary.save();
    }

    // Update payroll record with current currency AND company details
    payroll.currency = currentCurrency;
    payroll.companyDetails = currentCompanyDetails;
    payroll.ctc = parseFloat(ctc);
    payroll.basicSalary = parseFloat(basicSalary);
    payroll.hra = parseFloat(hra);
    payroll.fixedAllowance = parseFloat(fixedAllowance);
    payroll.conveyanceAllowance = parseFloat(conveyanceAllowance);
    payroll.childrenEducationAllowance = parseFloat(childrenEducationAllowance);
    payroll.medicalAllowance = parseFloat(medicalAllowance);
    payroll.shiftAllowance = parseFloat(shiftAllowance);
    payroll.mobileInternetAllowance = parseFloat(mobileInternetAllowance);
    payroll.employeeEPF = parseFloat(employeeEPF);
    payroll.employeeESI = parseFloat(employeeESI);
    payroll.professionalTax = parseFloat(professionalTax);
    payroll.grossEarnings = grossEarnings;
    payroll.totalDeductions = totalDeductions;
    payroll.netPay = grossEarnings - totalDeductions;
    payroll.employerEPF = parseFloat(basicSalary) * 0.12;
    payroll.employerESI = grossEarnings * 0.0325;

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
        currency: payroll.currency,
        companyDetails: payroll.companyDetails,
        ctc: payroll.ctc,
        basicSalary: payroll.basicSalary,
        hra: payroll.hra,
        fixedAllowance: payroll.fixedAllowance,
        conveyanceAllowance: payroll.conveyanceAllowance,
        childrenEducationAllowance: payroll.childrenEducationAllowance,
        medicalAllowance: payroll.medicalAllowance,
        shiftAllowance: payroll.shiftAllowance,
        mobileInternetAllowance: payroll.mobileInternetAllowance,
        grossEarnings: payroll.grossEarnings,
        employeeEPF: payroll.employeeEPF,
        employeeESI: payroll.employeeESI,
        professionalTax: payroll.professionalTax,
        totalDeductions: payroll.totalDeductions,
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
    const { updates } = req.body; // Array of payroll updates

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Updates array is required" });
    }

    // NEW: Get current currency for current month edits
    const currentCurrency = await getCurrentCurrency();
    // NEW: Get current company details for current month edits
    const currentCompanyDetails = await getCurrentCompanyDetails();

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

        // Calculate gross earnings and deductions
        const grossEarnings =
          parseFloat(update.basicSalary) +
          parseFloat(update.hra) +
          parseFloat(update.fixedAllowance) +
          parseFloat(update.conveyanceAllowance) +
          parseFloat(update.childrenEducationAllowance) +
          parseFloat(update.medicalAllowance) +
          parseFloat(update.shiftAllowance) +
          parseFloat(update.mobileInternetAllowance);

        const totalDeductions =
          parseFloat(update.employeeEPF) +
          parseFloat(update.employeeESI) +
          parseFloat(update.professionalTax);

        if (totalDeductions > grossEarnings) {
          errors.push(
            `Total deductions exceed gross earnings for: ${payroll.employeeId}`
          );
          continue;
        }

        // FIXED: Also update EmployeeSalary when payroll is updated
        const employeeSalary = await EmployeeSalary.findOne({
          employeeId: payroll.employeeId,
        }).sort({ effectiveFrom: -1 });

        if (employeeSalary) {
          employeeSalary.ctc = parseFloat(update.ctc);
          employeeSalary.basicSalary = parseFloat(update.basicSalary);
          employeeSalary.hra = parseFloat(update.hra);
          employeeSalary.fixedAllowance = parseFloat(update.fixedAllowance);
          employeeSalary.conveyanceAllowance = parseFloat(
            update.conveyanceAllowance
          );
          employeeSalary.childrenEducationAllowance = parseFloat(
            update.childrenEducationAllowance
          );
          employeeSalary.medicalAllowance = parseFloat(update.medicalAllowance);
          employeeSalary.shiftAllowance = parseFloat(update.shiftAllowance);
          employeeSalary.mobileInternetAllowance = parseFloat(
            update.mobileInternetAllowance
          );
          employeeSalary.employeeEPF = parseFloat(update.employeeEPF);
          employeeSalary.employeeESI = parseFloat(update.employeeESI);
          employeeSalary.professionalTax = parseFloat(update.professionalTax);
          employeeSalary.grossEarnings = grossEarnings;
          employeeSalary.totalDeductions = totalDeductions;
          employeeSalary.netPay = grossEarnings - totalDeductions;
          employeeSalary.employerEPF = parseFloat(update.basicSalary) * 0.12;
          employeeSalary.employerESI = grossEarnings * 0.0325;
          await employeeSalary.save();
        } else {
          const newSalary = new EmployeeSalary({
            employeeId: payroll.employeeId,
            ctc: parseFloat(update.ctc),
            basicSalary: parseFloat(update.basicSalary),
            hra: parseFloat(update.hra),
            fixedAllowance: parseFloat(update.fixedAllowance),
            conveyanceAllowance: parseFloat(update.conveyanceAllowance),
            childrenEducationAllowance: parseFloat(
              update.childrenEducationAllowance
            ),
            medicalAllowance: parseFloat(update.medicalAllowance),
            shiftAllowance: parseFloat(update.shiftAllowance),
            mobileInternetAllowance: parseFloat(update.mobileInternetAllowance),
            employeeEPF: parseFloat(update.employeeEPF),
            employeeESI: parseFloat(update.employeeESI),
            professionalTax: parseFloat(update.professionalTax),
            grossEarnings: grossEarnings,
            totalDeductions: totalDeductions,
            netPay: grossEarnings - totalDeductions,
            employerEPF: parseFloat(update.basicSalary) * 0.12,
            employerESI: grossEarnings * 0.0325,
            effectiveFrom: new Date(),
          });
          await newSalary.save();
        }

        // Update payroll record with current currency AND company details
        payroll.currency = currentCurrency;
        payroll.companyDetails = currentCompanyDetails;
        payroll.ctc = parseFloat(update.ctc);
        payroll.basicSalary = parseFloat(update.basicSalary);
        payroll.hra = parseFloat(update.hra);
        payroll.fixedAllowance = parseFloat(update.fixedAllowance);
        payroll.conveyanceAllowance = parseFloat(update.conveyanceAllowance);
        payroll.childrenEducationAllowance = parseFloat(
          update.childrenEducationAllowance
        );
        payroll.medicalAllowance = parseFloat(update.medicalAllowance);
        payroll.shiftAllowance = parseFloat(update.shiftAllowance);
        payroll.mobileInternetAllowance = parseFloat(
          update.mobileInternetAllowance
        );
        payroll.employeeEPF = parseFloat(update.employeeEPF);
        payroll.employeeESI = parseFloat(update.employeeESI);
        payroll.professionalTax = parseFloat(update.professionalTax);
        payroll.grossEarnings = grossEarnings;
        payroll.totalDeductions = totalDeductions;
        payroll.netPay = grossEarnings - totalDeductions;
        payroll.employerEPF = parseFloat(update.basicSalary) * 0.12;
        payroll.employerESI = grossEarnings * 0.0325;
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
          currency: payroll.currency,
          companyDetails: payroll.companyDetails,
          ctc: payroll.ctc,
          basicSalary: payroll.basicSalary,
          hra: payroll.hra,
          fixedAllowance: payroll.fixedAllowance,
          conveyanceAllowance: payroll.conveyanceAllowance,
          childrenEducationAllowance: payroll.childrenEducationAllowance,
          medicalAllowance: payroll.medicalAllowance,
          shiftAllowance: payroll.shiftAllowance,
          mobileInternetAllowance: payroll.mobileInternetAllowance,
          grossEarnings: payroll.grossEarnings,
          employeeEPF: payroll.employeeEPF,
          employeeESI: payroll.employeeESI,
          professionalTax: payroll.professionalTax,
          totalDeductions: payroll.totalDeductions,
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

    // NEW: Get current currency for rerun
    const currentCurrency = await getCurrentCurrency();
    // NEW: Get current company details for rerun
    const currentCompanyDetails = await getCurrentCompanyDetails();

    const employees = await Employee.find({ status: "active" });
    const payrollResults = [];
    let updatedCount = 0;

    for (const employee of employees) {
      const salaryInfo = await EmployeeSalary.findOne({
        employeeId: employee.employeeId,
      }).sort({ effectiveFrom: -1 });

      if (salaryInfo) {
        const existingPayroll = await Payroll.findOne({
          employeeId: employee.employeeId,
          month,
          year,
        });

        if (existingPayroll) {
          // FIXED: Only update salary data for current month rerun
          // Update existing payroll record with latest salary data AND current currency AND company details
          existingPayroll.currency = currentCurrency;
          existingPayroll.companyDetails = currentCompanyDetails;
          existingPayroll.ctc = salaryInfo.ctc || 0;
          existingPayroll.basicSalary = salaryInfo.basicSalary || 0;
          existingPayroll.hra = salaryInfo.hra || 0;
          existingPayroll.fixedAllowance = salaryInfo.fixedAllowance || 0;
          existingPayroll.conveyanceAllowance =
            salaryInfo.conveyanceAllowance || 0;
          existingPayroll.childrenEducationAllowance =
            salaryInfo.childrenEducationAllowance || 0;
          existingPayroll.medicalAllowance = salaryInfo.medicalAllowance || 0;
          existingPayroll.shiftAllowance = salaryInfo.shiftAllowance || 0;
          existingPayroll.mobileInternetAllowance =
            salaryInfo.mobileInternetAllowance || 0;
          existingPayroll.grossEarnings = salaryInfo.grossEarnings || 0;
          existingPayroll.employeeEPF = salaryInfo.employeeEPF || 0;
          existingPayroll.employeeESI = salaryInfo.employeeESI || 0;
          existingPayroll.professionalTax = salaryInfo.professionalTax || 0;
          existingPayroll.totalDeductions = salaryInfo.totalDeductions || 0;
          existingPayroll.employerEPF = salaryInfo.employerEPF || 0;
          existingPayroll.employerESI = salaryInfo.employerESI || 0;
          existingPayroll.netPay = salaryInfo.netPay || 0;
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
      currency: currentCurrency, // Return currency used for this rerun
      companyDetails: currentCompanyDetails, // Return company details used for this rerun
    });
  } catch (error) {
    console.error("Error in rerunPayroll:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update employee salary - MODIFIED: Added detailed salary structure and CTC
const updateEmployeeSalary = async (req, res) => {
  try {
    const {
      employeeId,
      ctc,
      basicSalary,
      hra,
      fixedAllowance,
      conveyanceAllowance,
      childrenEducationAllowance,
      medicalAllowance,
      shiftAllowance,
      mobileInternetAllowance,
      employeeEPF,
      employeeESI,
      professionalTax,
      effectiveFrom,
    } = req.body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Calculate gross earnings and deductions
    const grossEarnings =
      parseFloat(basicSalary) +
      parseFloat(hra) +
      parseFloat(fixedAllowance) +
      parseFloat(conveyanceAllowance) +
      parseFloat(childrenEducationAllowance) +
      parseFloat(medicalAllowance) +
      parseFloat(shiftAllowance) +
      parseFloat(mobileInternetAllowance);

    const totalDeductions =
      parseFloat(employeeEPF) +
      parseFloat(employeeESI) +
      parseFloat(professionalTax);
    const netPay = grossEarnings - totalDeductions;

    const salaryRecord = new EmployeeSalary({
      employeeId,
      ctc: parseFloat(ctc) || 0,
      // Earnings
      basicSalary: parseFloat(basicSalary) || 0,
      hra: parseFloat(hra) || 0,
      fixedAllowance: parseFloat(fixedAllowance) || 0,
      conveyanceAllowance: parseFloat(conveyanceAllowance) || 0,
      childrenEducationAllowance: parseFloat(childrenEducationAllowance) || 0,
      medicalAllowance: parseFloat(medicalAllowance) || 0,
      shiftAllowance: parseFloat(shiftAllowance) || 0,
      mobileInternetAllowance: parseFloat(mobileInternetAllowance) || 0,
      grossEarnings: grossEarnings,
      // Deductions
      employeeEPF: parseFloat(employeeEPF) || 0,
      employeeESI: parseFloat(employeeESI) || 0,
      professionalTax: parseFloat(professionalTax) || 0,
      totalDeductions: totalDeductions,
      // Employer Contributions
      employerEPF: parseFloat(basicSalary) * 0.12 || 0,
      employerESI: grossEarnings * 0.0325 || 0,
      netPay: netPay,
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

// Calculate salary from CTC - RENAMED THIS FUNCTION TO AVOID DUPLICATE
const calculateSalaryFromCTCController = async (req, res) => {
  try {
    const { ctc } = req.body;

    if (!ctc) {
      return res.status(400).json({ message: "CTC is required" });
    }

    const salaryComponents = calculateSalaryComponentsFromCTC(parseFloat(ctc));

    res.json({
      message: "Salary components calculated successfully",
      ctc: parseFloat(ctc),
      monthlyCTC: parseFloat(ctc) / 12,
      ...salaryComponents,
      grossEarnings:
        salaryComponents.basicSalary +
        salaryComponents.hra +
        salaryComponents.fixedAllowance +
        salaryComponents.conveyanceAllowance +
        salaryComponents.childrenEducationAllowance +
        salaryComponents.medicalAllowance +
        salaryComponents.shiftAllowance +
        salaryComponents.mobileInternetAllowance,
      totalDeductions:
        salaryComponents.employeeEPF +
        salaryComponents.employeeESI +
        salaryComponents.professionalTax,
      netPay:
        salaryComponents.basicSalary +
        salaryComponents.hra +
        salaryComponents.fixedAllowance +
        salaryComponents.conveyanceAllowance +
        salaryComponents.childrenEducationAllowance +
        salaryComponents.medicalAllowance +
        salaryComponents.shiftAllowance +
        salaryComponents.mobileInternetAllowance -
        (salaryComponents.employeeEPF +
          salaryComponents.employeeESI +
          salaryComponents.professionalTax),
    });
  } catch (error) {
    console.error("Error in calculateSalaryFromCTC:", error);
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

// Generate payslip - UPDATED: Added company information and updated employee details
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

    // Format date of joining
    const formatDateOfJoining = (date) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    // Filter out zero-value earnings
    const earningsBreakdown = [
      { name: "Basic Salary", amount: payroll.basicSalary },
      { name: "House Rent Allowance", amount: payroll.hra },
      { name: "Fixed Allowance", amount: payroll.fixedAllowance },
      { name: "Conveyance Allowance", amount: payroll.conveyanceAllowance },
      {
        name: "Children Education Allowance",
        amount: payroll.childrenEducationAllowance,
      },
      { name: "Medical Allowance", amount: payroll.medicalAllowance },
      { name: "Shift Allowance", amount: payroll.shiftAllowance },
      {
        name: "Mobile/Internet Allowance",
        amount: payroll.mobileInternetAllowance,
      },
    ].filter((item) => item.amount > 0);

    // Filter out zero-value deductions
    const deductionsBreakdown = [
      { name: "Employee EPF", amount: payroll.employeeEPF },
      { name: "Employee ESI", amount: payroll.employeeESI },
      { name: "Professional Tax", amount: payroll.professionalTax },
    ].filter((item) => item.amount > 0);

    // Build address from stored company details
    const companyDetails = payroll.companyDetails;
    const companyAddress = `${companyDetails.address.street}, ${companyDetails.address.city}, ${companyDetails.address.state} - ${companyDetails.address.zipCode}, ${companyDetails.address.country}`;

    const payslipData = {
      // Company Information - Use historical company details from payroll record
      companyName: companyDetails.name,
      companyAddress: companyAddress,
      companyLogo: companyDetails.logo, // This will use the uploaded logo
      companyDetails: companyDetails, // Pass entire object

      // Payroll Period Information
      payslipTitle: `Payslip for the month of ${payroll.month} ${payroll.year}`,
      month: payroll.month,
      year: payroll.year,

      // NEW: Include stored currency for payslip
      currency: payroll.currency,

      // Employee Information
      employeeName: employee.name,
      employeeId: employee.employeeId,
      designation: employee.designation,
      employmentType: employee.employmentType,
      dateOfJoining: formatDateOfJoining(employee.dateOfJoining),
      location: employee.location,

      // Earnings
      earningsBreakdown,
      grossEarnings: payroll.grossEarnings,

      // Deductions
      deductionsBreakdown,
      totalDeductions: payroll.totalDeductions,

      // Net Pay - NUMERIC VALUE ONLY
      netPay: payroll.netPay,

      // CTC Information
      ctc: payroll.ctc,

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

// NEW: Get employee's own payslips (using same pattern as leave system)
const getEmployeePayslips = async (req, res) => {
  try {
    const { employeeId } = req.params; // Get employeeId from URL parameters like leave system

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    console.log("Fetching payslips for employee:", employeeId);

    const payrolls = await Payroll.find({ employeeId }).sort({
      year: -1,
      month: -1,
    });

    // Add month number for proper sorting
    const payrollsWithSort = payrolls.map((payroll) => {
      const monthNumber = getMonthNumber(payroll.month);
      return {
        ...payroll.toObject(),
        monthNumber,
        yearNumber: payroll.year,
      };
    });

    // Sort by year and month
    const sortedPayrolls = payrollsWithSort.sort((a, b) => {
      if (a.yearNumber !== b.yearNumber) {
        return b.yearNumber - a.yearNumber;
      }
      return b.monthNumber - a.monthNumber;
    });

    // Remove temporary sorting fields
    const finalPayrolls = sortedPayrolls.map(
      ({ monthNumber, yearNumber, ...payroll }) => payroll
    );

    console.log(
      `Found ${finalPayrolls.length} payslips for employee ${employeeId}`
    );
    res.json(finalPayrolls);
  } catch (error) {
    console.error("Error in getEmployeePayslips:", error);
    res.status(500).json({ message: error.message });
  }
};

// NEW: Get employee's payslip by specific month and year
const getEmployeePayslipByMonth = async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "Employee ID, month, and year are required",
      });
    }

    console.log(`Fetching payslip for ${employeeId} - ${month} ${year}`);

    const payroll = await Payroll.findOne({
      employeeId,
      month,
      year: parseInt(year),
    });

    if (!payroll) {
      return res.status(404).json({
        message: "Payslip not found for the specified period",
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Format date of joining
    const formatDateOfJoining = (date) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    // Filter out zero-value earnings
    const earningsBreakdown = [
      { name: "Basic Salary", amount: payroll.basicSalary },
      { name: "House Rent Allowance", amount: payroll.hra },
      { name: "Fixed Allowance", amount: payroll.fixedAllowance },
      { name: "Conveyance Allowance", amount: payroll.conveyanceAllowance },
      {
        name: "Children Education Allowance",
        amount: payroll.childrenEducationAllowance,
      },
      { name: "Medical Allowance", amount: payroll.medicalAllowance },
      { name: "Shift Allowance", amount: payroll.shiftAllowance },
      {
        name: "Mobile/Internet Allowance",
        amount: payroll.mobileInternetAllowance,
      },
    ].filter((item) => item.amount > 0);

    // Filter out zero-value deductions
    const deductionsBreakdown = [
      { name: "Employee EPF", amount: payroll.employeeEPF },
      { name: "Employee ESI", amount: payroll.employeeESI },
      { name: "Professional Tax", amount: payroll.professionalTax },
    ].filter((item) => item.amount > 0);

    // Build address from stored company details
    const companyDetails = payroll.companyDetails;
    const companyAddress = `${companyDetails.address.street}, ${companyDetails.address.city}, ${companyDetails.address.state} - ${companyDetails.address.zipCode}, ${companyDetails.address.country}`;

    const payslipData = {
      // Company Information - Use historical company details
      companyName: companyDetails.name,
      companyAddress: companyAddress,
      companyLogo: companyDetails.logo, // This will use the uploaded logo
      companyDetails: companyDetails,

      // Payroll Period Information
      payslipTitle: `Payslip for the month of ${payroll.month} ${payroll.year}`,
      month: payroll.month,
      year: payroll.year,

      // NEW: Include stored currency
      currency: payroll.currency,

      // Employee Information
      employeeName: employee.name,
      employeeId: employee.employeeId,
      designation: employee.designation,
      employmentType: employee.employmentType,
      dateOfJoining: formatDateOfJoining(employee.dateOfJoining),
      location: employee.location,

      // Earnings
      earningsBreakdown,
      grossEarnings: payroll.grossEarnings,

      // Deductions
      deductionsBreakdown,
      totalDeductions: payroll.totalDeductions,

      // Net Pay - NUMERIC VALUE ONLY
      netPay: payroll.netPay,

      // CTC Information
      ctc: payroll.ctc,

      // Status
      status: payroll.status,

      generatedDate: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    res.json(payslipData);
  } catch (error) {
    console.error("Error in getEmployeePayslipByMonth:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployeesWithSalary,
  runPayroll,
  runIndividualPayroll,
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
  syncCurrentMonthPayroll,
  getEmployeePayslips,
  getEmployeePayslipByMonth,
  calculateSalaryFromCTC: calculateSalaryFromCTCController, // Use the renamed function
};
