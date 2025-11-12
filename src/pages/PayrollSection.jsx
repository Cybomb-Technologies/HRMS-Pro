import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "../components/ui/use-toast";
import { Badge } from "../components/ui/badge";
import {
  Search,
  RefreshCw,
  Download,
  Edit,
  MoreVertical,
  Users,
  IndianRupee,
  Calendar,
  Building,
  Briefcase,
  Check,
  FileText,
  Plus,
  Trash2,
  Eye,
  Calculator,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";

const PayrollSection = () => {
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPayroll, setCurrentPayroll] = useState([]);
  const [currentPayrollMeta, setCurrentPayrollMeta] = useState({});
  const [activeTab, setActiveTab] = useState("employees");
  const [selectedMonthHistory, setSelectedMonthHistory] = useState("");
  const [selectedYearHistory, setSelectedYearHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [payrollHistoryLoading, setPayrollHistoryLoading] = useState(false);
  const [generatingPayslip, setGeneratingPayslip] = useState(null);
  const [runPayrollLoading, setRunPayrollLoading] = useState(false);
  const [showPayrollResults, setShowPayrollResults] = useState(false);
  const [payrollResults, setPayrollResults] = useState(null);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [lastPayrollRun, setLastPayrollRun] = useState(null);
  const [lastRunLoading, setLastRunLoading] = useState(false);
  const [editingPayrollData, setEditingPayrollData] = useState({});
  const [deletingPayroll, setDeletingPayroll] = useState(null);
  const [salaryEdits, setSalaryEdits] = useState({});
  const [refreshingPayrollDetails, setRefreshingPayrollDetails] =
    useState(false);
  const [refreshingPayrollHistory, setRefreshingPayrollHistory] =
    useState(false);

  // New state for individual employee payroll
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [individualPayrollLoading, setIndividualPayrollLoading] =
    useState(null);

  // New state for expanded rows in payroll history
  const [expandedRows, setExpandedRows] = useState({});

  // New state for popup editing
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    ctc: 0,
    basicSalary: 0,
    hra: 0,
    fixedAllowance: 0,
    conveyanceAllowance: 0,
    childrenEducationAllowance: 0,
    medicalAllowance: 0,
    shiftAllowance: 0,
    mobileInternetAllowance: 0,
    employeeEPF: 0,
    employeeESI: 0,
    professionalTax: 0,
  });
  const [calculatingFromCTC, setCalculatingFromCTC] = useState(false);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermEmployees, setSearchTermEmployees] = useState("");
  const [searchTermPayroll, setSearchTermPayroll] = useState("");

  const months = [
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
  ];

  const years = [2023, 2024, 2025, 2026];

  // API base URL
  const API_BASE =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

  // Function to convert number to words
  const convertNumberToWords = (num) => {
    if (num === 0) return "Zero";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const formatNumber = (n) => {
      if (n < 20) return ones[n];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + formatNumber(n % 100) : "")
        );
      if (n < 100000)
        return (
          formatNumber(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 !== 0 ? " " + formatNumber(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          formatNumber(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 !== 0 ? " " + formatNumber(n % 100000) : "")
        );
      return (
        formatNumber(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 !== 0 ? " " + formatNumber(n % 10000000) : "")
      );
    };

    // Handle decimal numbers
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let words = formatNumber(integerPart);

    // Add "Only" at the end
    words += " Only";

    return words;
  };

  // Function to format Net Pay display for employee cards and payroll history (amount only)
  const formatNetPayAmountOnly = (amount) => {
    const numericAmount =
      typeof amount === "number" ? amount : parseFloat(amount) || 0;
    return `Rs. ${numericAmount.toFixed(2)}`;
  };

  // Function to format Net Pay display for payslip (with words)
  const formatNetPayWithWords = (amount) => {
    const numericAmount =
      typeof amount === "number" ? amount : parseFloat(amount) || 0;
    const words = convertNumberToWords(numericAmount);
    return `Rs. ${numericAmount.toFixed(2)} (Indian Rupee ${words})`;
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
    fetchLastPayrollRun();
  }, []);

  // Calculate derived values from form data
  const calculateDerivedValues = (formData) => {
    const grossEarnings =
      (parseFloat(formData.basicSalary) || 0) +
      (parseFloat(formData.hra) || 0) +
      (parseFloat(formData.fixedAllowance) || 0) +
      (parseFloat(formData.conveyanceAllowance) || 0) +
      (parseFloat(formData.childrenEducationAllowance) || 0) +
      (parseFloat(formData.medicalAllowance) || 0) +
      (parseFloat(formData.shiftAllowance) || 0) +
      (parseFloat(formData.mobileInternetAllowance) || 0);

    const totalDeductions =
      (parseFloat(formData.employeeEPF) || 0) +
      (parseFloat(formData.employeeESI) || 0) +
      (parseFloat(formData.professionalTax) || 0);

    const netPay = grossEarnings - totalDeductions;

    return {
      grossEarnings,
      totalDeductions,
      netPay,
      monthlyCTC: (parseFloat(formData.ctc) || 0) / 12,
    };
  };

  // Toggle expanded row
  const toggleExpandedRow = (payrollId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [payrollId]: !prev[payrollId],
    }));
  };

  // Employee selection functions
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allEmployeeIds = filteredEmployees.map((emp) => emp.employeeId);
      setSelectedEmployees(allEmployeeIds);
    }
    setSelectAll(!selectAll);
  };

  const handleClearSelection = () => {
    setSelectedEmployees([]);
    setSelectAll(false);
  };

  // Search functions
  const filterEmployees = (employees, searchTerm) => {
    if (!searchTerm) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(
      (employee) =>
        employee.employeeId?.toLowerCase().includes(term) ||
        employee.name?.toLowerCase().includes(term) ||
        employee.department?.toLowerCase().includes(term) ||
        employee.designation?.toLowerCase().includes(term) ||
        employee.employmentType?.toLowerCase().includes(term)
    );
  };

  const filterPayrollHistory = (history, searchTerm) => {
    if (!searchTerm) return history;
    const term = searchTerm.toLowerCase();
    return history.filter(
      (period) =>
        period._id.month?.toLowerCase().includes(term) ||
        period._id.year?.toString().includes(term) ||
        period.overallStatus?.toLowerCase().includes(term)
    );
  };

  const filterPayrollRecords = (payrolls, searchTerm) => {
    if (!searchTerm) return payrolls;
    const term = searchTerm.toLowerCase();
    return payrolls.filter(
      (payroll) =>
        payroll.employeeId?.toLowerCase().includes(term) ||
        payroll.employeeDetails?.name?.toLowerCase().includes(term) ||
        payroll.employeeDetails?.department?.toLowerCase().includes(term) ||
        payroll.employeeDetails?.designation?.toLowerCase().includes(term) ||
        payroll.status?.toLowerCase().includes(term)
    );
  };

  // Get filtered data based on active tab
  const filteredEmployees = filterEmployees(employees, searchTermEmployees);
  const filteredPayrollHistory = filterPayrollHistory(
    payrollHistory,
    searchTerm
  );
  const filteredCurrentPayroll = filterPayrollRecords(
    currentPayroll,
    searchTermPayroll
  );

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/payroll/employees`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setEmployees(data);

      toast({
        title: "Success",
        description: `Loaded ${data.length} employees`,
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate salary from CTC
  const handleCalculateFromCTC = async (ctc) => {
    try {
      setCalculatingFromCTC(true);
      const response = await fetch(
        `${API_BASE}/api/payroll/calculate-from-ctc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ctc }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      setEditFormData((prev) => ({
        ...prev,
        basicSalary: data.basicSalary,
        hra: data.hra,
        fixedAllowance: data.fixedAllowance,
        conveyanceAllowance: data.conveyanceAllowance,
        childrenEducationAllowance: data.childrenEducationAllowance,
        medicalAllowance: data.medicalAllowance,
        shiftAllowance: data.shiftAllowance,
        mobileInternetAllowance: data.mobileInternetAllowance,
        employeeEPF: data.employeeEPF,
        employeeESI: data.employeeESI,
        professionalTax: data.professionalTax,
      }));

      toast({
        title: "Success",
        description: "Salary components calculated from CTC",
      });
    } catch (error) {
      console.error("Error calculating from CTC:", error);
      toast({
        title: "Error",
        description: "Failed to calculate salary from CTC",
        variant: "destructive",
      });
    } finally {
      setCalculatingFromCTC(false);
    }
  };

  // Open edit dialog for employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      ctc: employee.ctc || 0,
      basicSalary: employee.basicSalary || 0,
      hra: employee.hra || 0,
      fixedAllowance: employee.fixedAllowance || 0,
      conveyanceAllowance: employee.conveyanceAllowance || 0,
      childrenEducationAllowance: employee.childrenEducationAllowance || 0,
      medicalAllowance: employee.medicalAllowance || 0,
      shiftAllowance: employee.shiftAllowance || 0,
      mobileInternetAllowance: employee.mobileInternetAllowance || 0,
      employeeEPF: employee.employeeEPF || 0,
      employeeESI: employee.employeeESI || 0,
      professionalTax: employee.professionalTax || 0,
    });
    setIsEditDialogOpen(true);
  };

  // Handle form input changes
  const handleEditFormChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    setEditFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  // Save salary changes
  const handleSaveSalary = async () => {
    if (!selectedEmployee) return;

    try {
      setSavingEdits(true);
      const response = await fetch(`${API_BASE}/api/payroll/salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.employeeId,
          ...editFormData,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      toast({
        title: "Success",
        description: `Salary updated for ${selectedEmployee.name}`,
      });

      // Refresh employees list
      await fetchEmployees();
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Error updating salary:", error);
      toast({
        title: "Error",
        description: "Failed to update salary",
        variant: "destructive",
      });
    } finally {
      setSavingEdits(false);
    }
  };

  // Run payroll for individual employee - MODIFIED: Show success modal instead of just toast
  const handleRunIndividualPayroll = async (employeeId) => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select month and year first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIndividualPayrollLoading(employeeId);
      const response = await fetch(`${API_BASE}/api/payroll/run-individual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          employeeId: employeeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // MODIFIED: Set payroll results and show success modal instead of just toast
      setPayrollResults({
        message: `Payroll ${data.action} for ${data.employee.name}`,
        totalEmployees: 1,
        processedEmployees: 1,
        createdCount: data.action === "created" ? 1 : 0,
        updatedCount: data.action === "updated" ? 1 : 0,
        skippedCount: 0,
        isCurrentMonth: data.isCurrentMonth,
        period: {
          month: selectedMonth,
          year: selectedYear,
        },
      });
      setShowPayrollResults(true);

      // Refresh data
      fetchPayrollHistory();
      fetchLastPayrollRun();
    } catch (error) {
      console.error("Error running individual payroll:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to run payroll",
        variant: "destructive",
      });
    } finally {
      setIndividualPayrollLoading(null);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      setPayrollHistoryLoading(true);
      const response = await fetch(`${API_BASE}/api/payroll/history`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPayrollHistory(data || []);
    } catch (error) {
      console.error("Error fetching payroll history:", error);
      setPayrollHistory([]);
    } finally {
      setPayrollHistoryLoading(false);
    }
  };

  const refreshPayrollHistory = async () => {
    try {
      setRefreshingPayrollHistory(true);
      await fetchPayrollHistory();
      toast({
        title: "Refreshed",
        description: "Payroll history updated",
      });
    } catch (error) {
      console.error("Error refreshing payroll history:", error);
      toast({
        title: "Error",
        description: "Failed to refresh payroll history",
        variant: "destructive",
      });
    } finally {
      setRefreshingPayrollHistory(false);
    }
  };

  const fetchLastPayrollRun = async () => {
    try {
      setLastRunLoading(true);
      const response = await fetch(`${API_BASE}/api/payroll/last-run`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setLastPayrollRun(data);
    } catch (error) {
      console.error("Error fetching last payroll run:", error);
      setLastPayrollRun({ exists: false });
    } finally {
      setLastRunLoading(false);
    }
  };

  const fetchPayrollByMonth = async (month, year) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/payroll/month/${month}/${year}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          setCurrentPayroll([]);
          setCurrentPayrollMeta({});
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentPayroll(data.payrolls || []);
      setCurrentPayrollMeta({
        canEdit: data.canEdit,
        month: data.month,
        year: data.year,
      });
      setSelectedMonthHistory(month);
      setSelectedYearHistory(year);
      setEditingPayrollData({});
      setExpandedRows({});
      setSearchTermPayroll("");
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      setCurrentPayroll([]);
      setCurrentPayrollMeta({});
    }
  };

  const refreshPayrollDetails = async () => {
    if (!selectedMonthHistory || !selectedYearHistory) {
      toast({
        title: "Info",
        description: "Please select a payroll period first",
      });
      return;
    }

    try {
      setRefreshingPayrollDetails(true);
      await fetchPayrollByMonth(selectedMonthHistory, selectedYearHistory);
      toast({
        title: "Refreshed",
        description: `Payroll details for ${selectedMonthHistory} ${selectedYearHistory} updated`,
      });
    } catch (error) {
      console.error("Error refreshing payroll details:", error);
      toast({
        title: "Error",
        description: "Failed to refresh payroll details",
        variant: "destructive",
      });
    } finally {
      setRefreshingPayrollDetails(false);
    }
  };

  const handleDeletePayroll = async (month, year) => {
    if (
      !window.confirm(
        `Are you sure you want to delete payroll for ${month} ${year}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingPayroll(`${month}-${year}`);
      const response = await fetch(
        `${API_BASE}/api/payroll/month/${month}/${year}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      fetchPayrollHistory();
      fetchLastPayrollRun();

      if (selectedMonthHistory === month && selectedYearHistory === year) {
        setCurrentPayroll([]);
        setCurrentPayrollMeta({});
        setSelectedMonthHistory("");
        setSelectedYearHistory("");
      }
    } catch (error) {
      console.error("Error deleting payroll:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete payroll",
        variant: "destructive",
      });
    } finally {
      setDeletingPayroll(null);
    }
  };

  const handleRunPayroll = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select month and year",
        variant: "destructive",
      });
      return;
    }

    // Check if any employees are selected
    if (selectedEmployees.length === 0) {
      toast({
        title: "Info",
        description: "Please select at least one employee to process payroll",
      });
      return;
    }

    // Check if selected employees have salary data
    const employeesWithoutSalary = filteredEmployees
      .filter((emp) => selectedEmployees.includes(emp.employeeId))
      .filter(
        (emp) =>
          emp.basicSalary === 0 &&
          emp.grossEarnings === 0 &&
          emp.totalDeductions === 0
      );

    if (employeesWithoutSalary.length > 0) {
      const employeeNames = employeesWithoutSalary
        .map((emp) => emp.name)
        .join(", ");
      toast({
        title: "Warning",
        description: `${employeesWithoutSalary.length} selected employees have zero salary: ${employeeNames}. Please set salaries first or remove them from selection.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setRunPayrollLoading(true);
      const response = await fetch(`${API_BASE}/api/payroll/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          employeeIds: selectedEmployees,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setPayrollResults(data);
      setShowPayrollResults(true);

      toast({
        title: "Success",
        description: `${data.message} (${data.createdCount} created, ${data.updatedCount} updated, ${data.skippedCount} skipped)`,
      });

      fetchPayrollHistory();
      fetchLastPayrollRun();
      handleClearSelection();
    } catch (error) {
      console.error("Error running payroll:", error);
      toast({
        title: "Error",
        description: "Failed to run payroll",
        variant: "destructive",
      });
    } finally {
      setRunPayrollLoading(false);
    }
  };

  const handlePayrollFieldChange = (payrollId, field, value) => {
    const numericValue = parseFloat(value);
    const safeValue = isNaN(numericValue) ? 0 : numericValue;

    setEditingPayrollData((prev) => {
      const currentEdits = prev[payrollId] || {};
      const payroll = currentPayroll.find((p) => p._id === payrollId);

      return {
        ...prev,
        [payrollId]: {
          ctc: currentEdits.ctc !== undefined ? currentEdits.ctc : payroll.ctc,
          basicSalary:
            currentEdits.basicSalary !== undefined
              ? currentEdits.basicSalary
              : payroll.basicSalary,
          hra: currentEdits.hra !== undefined ? currentEdits.hra : payroll.hra,
          fixedAllowance:
            currentEdits.fixedAllowance !== undefined
              ? currentEdits.fixedAllowance
              : payroll.fixedAllowance,
          conveyanceAllowance:
            currentEdits.conveyanceAllowance !== undefined
              ? currentEdits.conveyanceAllowance
              : payroll.conveyanceAllowance,
          childrenEducationAllowance:
            currentEdits.childrenEducationAllowance !== undefined
              ? currentEdits.childrenEducationAllowance
              : payroll.childrenEducationAllowance,
          medicalAllowance:
            currentEdits.medicalAllowance !== undefined
              ? currentEdits.medicalAllowance
              : payroll.medicalAllowance,
          shiftAllowance:
            currentEdits.shiftAllowance !== undefined
              ? currentEdits.shiftAllowance
              : payroll.shiftAllowance,
          mobileInternetAllowance:
            currentEdits.mobileInternetAllowance !== undefined
              ? currentEdits.mobileInternetAllowance
              : payroll.mobileInternetAllowance,
          employeeEPF:
            currentEdits.employeeEPF !== undefined
              ? currentEdits.employeeEPF
              : payroll.employeeEPF,
          employeeESI:
            currentEdits.employeeESI !== undefined
              ? currentEdits.employeeESI
              : payroll.employeeESI,
          professionalTax:
            currentEdits.professionalTax !== undefined
              ? currentEdits.professionalTax
              : payroll.professionalTax,
          [field]: safeValue,
        },
      };
    });
  };

  const handleSavePayrollEdits = async (payrollId) => {
    const edits = editingPayrollData[payrollId];
    if (!edits) return;

    const validatedEdits = {
      ctc: edits.ctc !== undefined && !isNaN(edits.ctc) ? edits.ctc : 0,
      basicSalary:
        edits.basicSalary !== undefined && !isNaN(edits.basicSalary)
          ? edits.basicSalary
          : 0,
      hra: edits.hra !== undefined && !isNaN(edits.hra) ? edits.hra : 0,
      fixedAllowance:
        edits.fixedAllowance !== undefined && !isNaN(edits.fixedAllowance)
          ? edits.fixedAllowance
          : 0,
      conveyanceAllowance:
        edits.conveyanceAllowance !== undefined &&
        !isNaN(edits.conveyanceAllowance)
          ? edits.conveyanceAllowance
          : 0,
      childrenEducationAllowance:
        edits.childrenEducationAllowance !== undefined &&
        !isNaN(edits.childrenEducationAllowance)
          ? edits.childrenEducationAllowance
          : 0,
      medicalAllowance:
        edits.medicalAllowance !== undefined && !isNaN(edits.medicalAllowance)
          ? edits.medicalAllowance
          : 0,
      shiftAllowance:
        edits.shiftAllowance !== undefined && !isNaN(edits.shiftAllowance)
          ? edits.shiftAllowance
          : 0,
      mobileInternetAllowance:
        edits.mobileInternetAllowance !== undefined &&
        !isNaN(edits.mobileInternetAllowance)
          ? edits.mobileInternetAllowance
          : 0,
      employeeEPF:
        edits.employeeEPF !== undefined && !isNaN(edits.employeeEPF)
          ? edits.employeeEPF
          : 0,
      employeeESI:
        edits.employeeESI !== undefined && !isNaN(edits.employeeESI)
          ? edits.employeeESI
          : 0,
      professionalTax:
        edits.professionalTax !== undefined && !isNaN(edits.professionalTax)
          ? edits.professionalTax
          : 0,
    };

    try {
      setSavingEdits(true);
      const response = await fetch(
        `${API_BASE}/api/payroll/record/${payrollId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validatedEdits),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Payroll record and employee salary updated successfully",
      });

      setEditingPayrollData((prev) => {
        const newData = { ...prev };
        delete newData[payrollId];
        return newData;
      });

      fetchPayrollByMonth(selectedMonthHistory, selectedYearHistory);
      fetchEmployees();
      fetchPayrollHistory();
    } catch (error) {
      console.error("Error saving payroll edits:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payroll record",
        variant: "destructive",
      });
    } finally {
      setSavingEdits(false);
    }
  };

  const handleBulkSavePayrollEdits = async () => {
    const updates = Object.keys(editingPayrollData).map((payrollId) => {
      const edits = editingPayrollData[payrollId];
      return {
        payrollId,
        ctc: edits.ctc !== undefined && !isNaN(edits.ctc) ? edits.ctc : 0,
        basicSalary:
          edits.basicSalary !== undefined && !isNaN(edits.basicSalary)
            ? edits.basicSalary
            : 0,
        hra: edits.hra !== undefined && !isNaN(edits.hra) ? edits.hra : 0,
        fixedAllowance:
          edits.fixedAllowance !== undefined && !isNaN(edits.fixedAllowance)
            ? edits.fixedAllowance
            : 0,
        conveyanceAllowance:
          edits.conveyanceAllowance !== undefined &&
          !isNaN(edits.conveyanceAllowance)
            ? edits.conveyanceAllowance
            : 0,
        childrenEducationAllowance:
          edits.childrenEducationAllowance !== undefined &&
          !isNaN(edits.childrenEducationAllowance)
            ? edits.childrenEducationAllowance
            : 0,
        medicalAllowance:
          edits.medicalAllowance !== undefined && !isNaN(edits.medicalAllowance)
            ? edits.medicalAllowance
            : 0,
        shiftAllowance:
          edits.shiftAllowance !== undefined && !isNaN(edits.shiftAllowance)
            ? edits.shiftAllowance
            : 0,
        mobileInternetAllowance:
          edits.mobileInternetAllowance !== undefined &&
          !isNaN(edits.mobileInternetAllowance)
            ? edits.mobileInternetAllowance
            : 0,
        employeeEPF:
          edits.employeeEPF !== undefined && !isNaN(edits.employeeEPF)
            ? edits.employeeEPF
            : 0,
        employeeESI:
          edits.employeeESI !== undefined && !isNaN(edits.employeeESI)
            ? edits.employeeESI
            : 0,
        professionalTax:
          edits.professionalTax !== undefined && !isNaN(edits.professionalTax)
            ? edits.professionalTax
            : 0,
      };
    });

    if (updates.length === 0) return;

    try {
      setSavingEdits(true);
      const response = await fetch(
        `${API_BASE}/api/payroll/records/bulk-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some errors occurred",
          description: data.errors.join(", "),
          variant: "destructive",
        });
      }

      setEditingPayrollData({});
      fetchPayrollByMonth(selectedMonthHistory, selectedYearHistory);
      fetchEmployees();
      fetchPayrollHistory();
    } catch (error) {
      console.error("Error saving bulk edits:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save edits",
        variant: "destructive",
      });
    } finally {
      setSavingEdits(false);
    }
  };

  const handleRerunPayroll = async () => {
    if (!selectedMonthHistory || !selectedYearHistory) {
      toast({
        title: "Error",
        description: "Please select a payroll period first",
        variant: "destructive",
      });
      return;
    }

    try {
      setRerunLoading(true);
      const response = await fetch(`${API_BASE}/api/payroll/rerun`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonthHistory,
          year: selectedYearHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      fetchPayrollByMonth(selectedMonthHistory, selectedYearHistory);
      fetchLastPayrollRun();
      fetchEmployees();
    } catch (error) {
      console.error("Error rerunning payroll:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to rerun payroll",
        variant: "destructive",
      });
    } finally {
      setRerunLoading(false);
    }
  };

  const handleGeneratePayslip = async (payrollId, employeeName) => {
    try {
      setGeneratingPayslip(payrollId);
      const response = await fetch(
        `${API_BASE}/api/payroll/payslip/${payrollId}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const payslipData = await response.json();
      generatePDF(payslipData, employeeName);

      toast({
        title: "Success",
        description: "Payslip downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Error",
        description: "Failed to download payslip",
        variant: "destructive",
      });
    } finally {
      setGeneratingPayslip(null);
    }
  };

  const generatePDF = (payslipData, employeeName) => {
    const doc = new jsPDF();

    // Set margins and starting position
    const leftMargin = 20;
    const rightMargin = 190;
    let yPosition = 20;

    // Company Header - Left Side
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Cybomb Technologies Pvt Ltd", leftMargin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(
      "Prime Plaza No.54/1, 1st street, Sripuram colony,",
      leftMargin,
      yPosition
    );
    yPosition += 5;
    doc.text(
      "St. Thomas Mount, Chennai, Tamil Nadu - 600 016, India",
      leftMargin,
      yPosition
    );
    yPosition += 5;

    // Logo Section - Right Side
    const logoX = 150;
    const logoY = 16;
    const logoSize = 22;

    // Black square background
    doc.setFillColor(0, 0, 0);
    doc.rect(logoX, logoY, logoSize, logoSize, "F");

    // White text inside logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont(undefined, "bold");

    // Split company name into two lines for better fit
    const companyNameLine1 = "Cybomb";
    const companyNameLine2 = "Technologies";

    // Calculate center positions
    const textWidth1 = doc.getTextWidth(companyNameLine1);
    const textWidth2 = doc.getTextWidth(companyNameLine2);
    const centerX1 = logoX + (logoSize - textWidth1) / 2;
    const centerX2 = logoX + (logoSize - textWidth2) / 2;

    // Position text vertically centered
    doc.text(companyNameLine1, centerX1, logoY + 10);
    doc.text(companyNameLine2, centerX2, logoY + 14);

    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPosition += 5;

    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 6;

    // Payslip Title
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(payslipData.payslipTitle, leftMargin, yPosition);
    yPosition += 10;

    // Employee Details
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(
      `Employee Name: ${payslipData.employeeName}`,
      leftMargin,
      yPosition
    );
    yPosition += 7;
    doc.text(`Employee ID: ${payslipData.employeeId}`, leftMargin, yPosition);
    yPosition += 7;
    doc.text(`Designation: ${payslipData.designation}`, leftMargin, yPosition);
    yPosition += 7;
    doc.text(
      `Employment Type: ${payslipData.employmentType}`,
      leftMargin,
      yPosition
    );
    yPosition += 7;
    doc.text(
      `Date of Joining: ${payslipData.dateOfJoining}`,
      leftMargin,
      yPosition
    );
    yPosition += 7;
    doc.text(`Location: ${payslipData.location}`, leftMargin, yPosition);
    yPosition += 7;

    // Add line separator
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 5;

    // Earnings Section
    if (payslipData.earningsBreakdown.length > 0) {
      // Earnings Header with gray background
      doc.setFillColor(240, 240, 240);
      doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 8, "F");

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("EARNINGS", leftMargin + 5, yPosition + 6);
      yPosition += 12;

      // Earnings table-like structure
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      payslipData.earningsBreakdown.forEach((earning, index) => {
        doc.text(`${earning.name}:`, leftMargin + 5, yPosition);
        doc.text(
          `Rs. ${earning.amount.toFixed(2)}`,
          rightMargin - 10,
          yPosition,
          { align: "right" }
        );
        yPosition += 7;
      });

      // Gross Earnings total with top border
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPosition, rightMargin, yPosition);
      yPosition += 5;

      doc.setFont(undefined, "bold");
      doc.text(`Gross Earnings:`, leftMargin + 5, yPosition);
      doc.text(
        `Rs. ${payslipData.grossEarnings.toFixed(2)}`,
        rightMargin - 10,
        yPosition,
        { align: "right" }
      );
      doc.setFont(undefined, "normal");
      yPosition += 8;
    }

    // Deductions Section
    if (payslipData.deductionsBreakdown.length > 0) {
      // Deductions Header with gray background
      doc.setFillColor(240, 240, 240);
      doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 8, "F");

      doc.setFont(undefined, "bold");
      doc.text("DEDUCTIONS", leftMargin + 5, yPosition + 6);
      doc.setFont(undefined, "normal");
      yPosition += 12;

      // Deductions table-like structure
      doc.setFontSize(10);
      payslipData.deductionsBreakdown.forEach((deduction, index) => {
        doc.text(`${deduction.name}:`, leftMargin + 5, yPosition);
        doc.text(
          `Rs. ${deduction.amount.toFixed(2)}`,
          rightMargin - 10,
          yPosition,
          { align: "right" }
        );
        yPosition += 7;
      });

      // Total Deductions with top border
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPosition, rightMargin, yPosition);
      yPosition += 5;

      doc.setFont(undefined, "bold");
      doc.text(`Total Deductions:`, leftMargin + 5, yPosition);
      doc.text(
        `Rs. ${payslipData.totalDeductions.toFixed(2)}`,
        rightMargin - 10,
        yPosition,
        { align: "right" }
      );
      doc.setFont(undefined, "normal");
      yPosition += 15;
    }

    // Net Pay Section - FIXED: Properly formatted on same line without overlapping
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 100, 0);

    // Net Pay background
    doc.setFillColor(240, 255, 240);
    doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 20, "F");

    // Calculate text widths for proper spacing
    const netPayLabel = "Net Pay: ";
    const netPayAmount = `Rs. ${payslipData.netPay.toFixed(2)}`;
    const amountInWords = `(Indian Rupee ${convertNumberToWords(
      payslipData.netPay
    )})`;

    // Set smaller font for amount in words to fit on same line
    doc.setFontSize(10);

    // Calculate positions
    const labelWidth = doc.getTextWidth(netPayLabel);
    const amountWidth = doc.getTextWidth(netPayAmount);
    const wordsWidth = doc.getTextWidth(amountInWords);

    const totalWidth = labelWidth + amountWidth + wordsWidth + 10; // +10 for spacing

    // Check if everything fits on one line
    const availableWidth = rightMargin - leftMargin - 10; // -10 for padding

    if (totalWidth <= availableWidth) {
      // Everything fits on one line - perfect!
      doc.text(netPayLabel, leftMargin + 5, yPosition + 8);
      doc.text(netPayAmount, leftMargin + 5 + labelWidth, yPosition + 8);
      doc.text(
        amountInWords,
        leftMargin + 5 + labelWidth + amountWidth + 5,
        yPosition + 8
      );
    } else {
      // If words are too long, put them on the next line
      doc.text(netPayLabel, leftMargin + 5, yPosition + 8);
      doc.text(netPayAmount, leftMargin + 5 + labelWidth, yPosition + 8);
      doc.setFontSize(8);
      doc.text(amountInWords, leftMargin + 5, yPosition + 16);
    }

    doc.setTextColor(0, 0, 0);
    yPosition += 25;

    // Footer at the bottom of the page
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 20;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer generated payslip", 105, footerY - 5, {
      align: "center",
    });

    // Save the PDF
    doc.save(
      `payslip-${employeeName}-${payslipData.month}-${payslipData.year}.pdf`
    );
  };

  const handleRunNewPayroll = () => {
    setShowPayrollResults(false);
    setPayrollResults(null);
  };

  const getCurrentMonthYear = () => {
    const currentDate = new Date();
    return {
      month: currentDate.toLocaleString("en-US", { month: "long" }),
      year: currentDate.getFullYear(),
    };
  };

  const isCurrentMonth = (month, year) => {
    const current = getCurrentMonthYear();
    return month === current.month && year === current.year;
  };

  const isEditable = (month, year) => {
    return isCurrentMonth(month, year);
  };

  const hasEdits = Object.keys(editingPayrollData).length > 0;

  const getSafeValue = (payroll, payrollId, field) => {
    const edits = editingPayrollData[payrollId];
    if (edits && edits[field] !== undefined && !isNaN(edits[field])) {
      return edits[field];
    }
    return payroll[field];
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "on-leave":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-probation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "terminated":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to get payroll status color
  const getPayrollStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "processed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const derivedValues = calculateDerivedValues(editFormData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IndianRupee className="w-8 h-8 text-blue-600" />
              Payroll Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage employee salaries and process payroll
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant={activeTab === "employees" ? "default" : "outline"}
              onClick={() => setActiveTab("employees")}
              className="px-4 py-2"
            >
              Manage Salaries
            </Button>
            <Button
              variant={activeTab === "run" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("run");
                setShowPayrollResults(false);
                setPayrollResults(null);
              }}
              className="px-4 py-2"
            >
              Run Payroll
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "outline"}
              onClick={() => setActiveTab("history")}
              className="px-4 py-2"
            >
              Payroll History
            </Button>
          </div>
        </div>

        {activeTab === "employees" && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Employee Salaries
                {!loading && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredEmployees.length} employees
                  </Badge>
                )}
              </h2>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTermEmployees}
                    onChange={(e) => setSearchTermEmployees(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={fetchEmployees}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading employees data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => {
                  const hasSalaryData =
                    employee.basicSalary > 0 || employee.grossEarnings > 0;
                  return (
                    <Card
                      key={employee.employeeId}
                      className={`p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
                        !hasSalaryData ? "border-orange-300 bg-orange-50" : ""
                      }`}
                      onClick={() => handleEditEmployee(employee)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {employee.name}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className={getStatusColor(employee.status)}
                              >
                                {employee.status?.replace("-", " ")}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                              >
                                {employee.employmentType}
                              </Badge>
                              {!hasSalaryData && (
                                <Badge
                                  variant="outline"
                                  className="bg-orange-100 text-orange-700 border-orange-200"
                                >
                                  No Salary Data
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Edit className="w-4 h-4 text-gray-400" />
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-3 h-3" />
                          <span>{employee.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="w-3 h-3" />
                          <span>{employee.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarDays className="w-3 h-3" />
                          <span>DOJ: {formatDate(employee.dateOfJoining)}</span>
                        </div>
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit">
                          {employee.employeeId}
                        </div>
                      </div>

                      <div className="space-y-2 border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            CTC (Annual):
                          </span>
                          <span className="text-sm font-semibold">
                            Rs. {(employee.ctc || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Gross Earnings:
                          </span>
                          <span className="text-sm font-semibold">
                            Rs. {(employee.grossEarnings || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Deductions:
                          </span>
                          <span className="text-sm font-semibold">
                            Rs. {(employee.totalDeductions || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-semibold text-gray-900">
                            Net Pay:
                          </span>
                          {/* FIXED: Only show amount, no words */}
                          <span className="text-sm font-bold text-green-600">
                            {formatNetPayAmountOnly(employee.netPay || 0)}
                          </span>
                        </div>
                      </div>

                      {/* UPDATED: Removed "Run Payroll" button, keeping only "Edit Salary" button */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEmployee(employee);
                          }}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Salary
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {employees.length > 0 && filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No employees match your search</p>
              </div>
            )}

            {employees.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No employees found</p>
              </div>
            )}
          </Card>
        )}

        {/* Edit Salary Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Salary - {selectedEmployee?.name}
              </DialogTitle>
              <DialogDescription>
                Update salary details for {selectedEmployee?.employeeId}
              </DialogDescription>
            </DialogHeader>

            {selectedEmployee && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Department</div>
                    <div>{selectedEmployee.department}</div>
                  </div>
                  <div>
                    <div className="font-medium">Designation</div>
                    <div>{selectedEmployee.designation}</div>
                  </div>
                  <div>
                    <div className="font-medium">Date of Joining</div>
                    <div>{formatDate(selectedEmployee.dateOfJoining)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Employee ID</div>
                    <div>{selectedEmployee.employeeId}</div>
                  </div>
                </div>

                {/* CTC Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    CTC & Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ctc" className="text-sm font-medium">
                        CTC (Annual) Rs.
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="ctc"
                          type="number"
                          value={editFormData.ctc}
                          onChange={(e) =>
                            handleEditFormChange("ctc", e.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            handleCalculateFromCTC(editFormData.ctc)
                          }
                          disabled={calculatingFromCTC || !editFormData.ctc}
                          className="flex items-center gap-2"
                        >
                          <Calculator className="w-4 h-4" />
                          {calculatingFromCTC ? "Calculating..." : "Calculate"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Monthly CTC</Label>
                      <div className="text-lg font-semibold text-gray-900 mt-1">
                        Rs. {derivedValues.monthlyCTC.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Earnings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="basicSalary"
                        className="text-sm font-medium"
                      >
                        Basic Salary Rs.
                      </Label>
                      <Input
                        id="basicSalary"
                        type="number"
                        value={editFormData.basicSalary}
                        onChange={(e) =>
                          handleEditFormChange("basicSalary", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hra" className="text-sm font-medium">
                        House Rent Allowance Rs.
                      </Label>
                      <Input
                        id="hra"
                        type="number"
                        value={editFormData.hra}
                        onChange={(e) =>
                          handleEditFormChange("hra", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="fixedAllowance"
                        className="text-sm font-medium"
                      >
                        Fixed Allowance Rs.
                      </Label>
                      <Input
                        id="fixedAllowance"
                        type="number"
                        value={editFormData.fixedAllowance}
                        onChange={(e) =>
                          handleEditFormChange("fixedAllowance", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="conveyanceAllowance"
                        className="text-sm font-medium"
                      >
                        Conveyance Allowance Rs.
                      </Label>
                      <Input
                        id="conveyanceAllowance"
                        type="number"
                        value={editFormData.conveyanceAllowance}
                        onChange={(e) =>
                          handleEditFormChange(
                            "conveyanceAllowance",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="childrenEducationAllowance"
                        className="text-sm font-medium"
                      >
                        Children Education Rs.
                      </Label>
                      <Input
                        id="childrenEducationAllowance"
                        type="number"
                        value={editFormData.childrenEducationAllowance}
                        onChange={(e) =>
                          handleEditFormChange(
                            "childrenEducationAllowance",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="medicalAllowance"
                        className="text-sm font-medium"
                      >
                        Medical Allowance Rs.
                      </Label>
                      <Input
                        id="medicalAllowance"
                        type="number"
                        value={editFormData.medicalAllowance}
                        onChange={(e) =>
                          handleEditFormChange(
                            "medicalAllowance",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="shiftAllowance"
                        className="text-sm font-medium"
                      >
                        Shift Allowance Rs.
                      </Label>
                      <Input
                        id="shiftAllowance"
                        type="number"
                        value={editFormData.shiftAllowance}
                        onChange={(e) =>
                          handleEditFormChange("shiftAllowance", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="mobileInternetAllowance"
                        className="text-sm font-medium"
                      >
                        Mobile/Internet Rs.
                      </Label>
                      <Input
                        id="mobileInternetAllowance"
                        type="number"
                        value={editFormData.mobileInternetAllowance}
                        onChange={(e) =>
                          handleEditFormChange(
                            "mobileInternetAllowance",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Deductions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="employeeEPF"
                        className="text-sm font-medium"
                      >
                        Employee EPF Rs.
                      </Label>
                      <Input
                        id="employeeEPF"
                        type="number"
                        value={editFormData.employeeEPF}
                        onChange={(e) =>
                          handleEditFormChange("employeeEPF", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="employeeESI"
                        className="text-sm font-medium"
                      >
                        Employee ESI Rs.
                      </Label>
                      <Input
                        id="employeeESI"
                        type="number"
                        value={editFormData.employeeESI}
                        onChange={(e) =>
                          handleEditFormChange("employeeESI", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="professionalTax"
                        className="text-sm font-medium"
                      >
                        Professional Tax Rs.
                      </Label>
                      <Input
                        id="professionalTax"
                        type="number"
                        value={editFormData.professionalTax}
                        onChange={(e) =>
                          handleEditFormChange(
                            "professionalTax",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900">
                    Salary Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gross Earnings:</span>
                        <span className="font-semibold">
                          Rs. {derivedValues.grossEarnings.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Deductions:</span>
                        <span className="font-semibold">
                          Rs. {derivedValues.totalDeductions.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Net Pay:</span>
                        {/* FIXED: Only show amount in dialog summary too */}
                        <span className="font-bold text-green-600">
                          {formatNetPayAmountOnly(derivedValues.netPay)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSalary}
                disabled={savingEdits}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {savingEdits ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Run Payroll Tab */}
        {activeTab === "run" && (
          <div className="space-y-6">
            {!showPayrollResults ? (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-xl">Run Payroll</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="month" className="text-sm font-medium">
                          Select Month
                        </Label>
                        <Select
                          value={selectedMonth}
                          onValueChange={setSelectedMonth}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year" className="text-sm font-medium">
                          Select Year
                        </Label>
                        <Select
                          value={selectedYear}
                          onValueChange={setSelectedYear}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Employee Selection Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Select Employees for Payroll
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                          >
                            {selectAll ? "Deselect All" : "Select All"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearSelection}
                          >
                            Clear Selection
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-lg">
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={selectAll}
                                    onCheckedChange={handleSelectAll}
                                  />
                                </TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Salary Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEmployees.map((employee) => {
                                const hasSalaryData =
                                  employee.basicSalary > 0 ||
                                  employee.grossEarnings > 0;
                                const isSelected = selectedEmployees.includes(
                                  employee.employeeId
                                );

                                return (
                                  <TableRow key={employee.employeeId}>
                                    <TableCell>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          handleSelectEmployee(
                                            employee.employeeId
                                          )
                                        }
                                        disabled={!hasSalaryData}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">
                                          {employee.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {employee.employeeId}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {employee.department}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {employee.designation}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {hasSalaryData ? (
                                        <Badge
                                          variant="success"
                                          className="text-xs"
                                        >
                                          Salary Configured
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          No Salary Data
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleEditEmployee(employee)
                                          }
                                        >
                                          <Edit className="w-3 h-3 mr-1" />
                                          Edit Salary
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleRunIndividualPayroll(
                                              employee.employeeId
                                            )
                                          }
                                          disabled={
                                            !hasSalaryData ||
                                            individualPayrollLoading ===
                                              employee.employeeId
                                          }
                                        >
                                          {individualPayrollLoading ===
                                          employee.employeeId ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                          ) : (
                                            "Run Individual"
                                          )}
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-blue-700">
                            <strong>{selectedEmployees.length}</strong>{" "}
                            employees selected out of{" "}
                            <strong>{filteredEmployees.length}</strong>
                          </p>
                          <p className="text-xs text-blue-600">
                            Employees without salary data cannot be selected for
                            payroll
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                          >
                            {selectAll ? "Deselect All" : "Select All"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearSelection}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800 mb-1">
                            Payroll Run Information
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>
                              • You can run payroll for selected employees or
                              all employees
                            </li>
                            <li>
                              • Employees without salary data will be skipped
                              automatically
                            </li>
                            <li>
                              • Payroll records will be created or updated for
                              the selected period
                            </li>
                            {selectedMonth &&
                              selectedYear &&
                              isCurrentMonth(selectedMonth, selectedYear) && (
                                <li className="text-green-700 font-semibold">
                                  • This is current month payroll - edit and
                                  rerun features will be available
                                </li>
                              )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleRunPayroll}
                        disabled={
                          runPayrollLoading ||
                          !selectedMonth ||
                          !selectedYear ||
                          selectedEmployees.length === 0
                        }
                        className="px-6 py-2"
                      >
                        {runPayrollLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing Payroll...
                          </>
                        ) : (
                          `Run Payroll for ${selectedEmployees.length} Employees`
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMonth("");
                          setSelectedYear(new Date().getFullYear());
                          handleClearSelection();
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {lastRunLoading ? (
                  <Card className="shadow-lg">
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">
                          Loading last payroll run...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : lastPayrollRun?.exists ? (
                  <Card className="shadow-lg border-l-4 border-l-blue-500">
                    <CardHeader className="bg-blue-50 border-b">
                      <CardTitle className="text-xl flex items-center gap-2 text-blue-800">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        Last Payroll Run
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {lastPayrollRun.summary.employeeCount}
                          </div>
                          <div className="text-sm text-gray-600">Employees</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            Rs.{" "}
                            {lastPayrollRun.summary.totalNetPay?.toFixed(2) ||
                              "0.00"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Net Pay
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            Rs.{" "}
                            {lastPayrollRun.summary.totalCTC?.toFixed(2) ||
                              "0.00"}
                          </div>
                          <div className="text-sm text-gray-600">Total CTC</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">
                            {lastPayrollRun.period.year}
                          </div>
                          <div className="text-sm text-gray-600">Year</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-700">
                            <strong>Processed:</strong>{" "}
                            {new Date(
                              lastPayrollRun.summary.processedDate
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>Status:</strong>{" "}
                            {lastPayrollRun.summary.isCurrentMonth
                              ? "Current Month (Editable)"
                              : "Previous Month (Read Only)"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveTab("history");
                            fetchPayrollByMonth(
                              lastPayrollRun.period.month,
                              lastPayrollRun.period.year
                            );
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-lg border-l-4 border-l-gray-300">
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Payroll Runs Yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Run your first payroll to see the history here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 border-b border-green-200">
                  <CardTitle className="text-xl text-green-800 flex items-center gap-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Payroll Processed Successfully
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {payrollResults.totalEmployees}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Total Employees
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {payrollResults.processedEmployees}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Processed
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {payrollResults.createdCount}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Created
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {payrollResults.updatedCount}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Updated
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Period:</strong>{" "}
                        {payrollResults.period?.month || selectedMonth}{" "}
                        {payrollResults.period?.year || selectedYear}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Status:</strong>{" "}
                        {payrollResults.isCurrentMonth
                          ? "Current Month (Editable)"
                          : "Previous Month (Read Only)"}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Message:</strong> {payrollResults.message}
                      </p>
                      {payrollResults.skippedCount > 0 && (
                        <p className="text-sm text-orange-700 mt-1">
                          <strong>Skipped:</strong>{" "}
                          {payrollResults.skippedCount} employees (no salary
                          data)
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => {
                          setActiveTab("history");
                          fetchPayrollByMonth(
                            payrollResults.period?.month || selectedMonth,
                            payrollResults.period?.year || selectedYear
                          );
                        }}
                        className="px-6 py-2"
                      >
                        View Payroll Details
                      </Button>
                      <Button variant="outline" onClick={handleRunNewPayroll}>
                        Run Another Payroll
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Payroll History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span>Payroll History</span>
                    {!payrollHistoryLoading && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredPayrollHistory.length} of{" "}
                        {payrollHistory.length} periods
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={refreshPayrollHistory}
                      disabled={refreshingPayrollHistory}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          refreshingPayrollHistory ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {payrollHistoryLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                      Loading payroll history...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {payrollHistory.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {filteredPayrollHistory.map((period) => (
                            <Card
                              key={`${period._id.month}-${period._id.year}`}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedMonthHistory === period._id.month &&
                                selectedYearHistory === period._id.year
                                  ? "ring-2 ring-blue-500 bg-blue-50"
                                  : ""
                              }`}
                              onClick={() =>
                                fetchPayrollByMonth(
                                  period._id.month,
                                  period._id.year
                                )
                              }
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      {period._id.month} {period._id.year}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {period.count} employees
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    {isEditable(
                                      period._id.month,
                                      period._id.year
                                    ) && (
                                      <Badge
                                        variant="success"
                                        className="text-xs mb-1"
                                      >
                                        Editable
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={
                                        period.overallStatus === "paid"
                                          ? "default"
                                          : period.overallStatus === "mixed"
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {period.overallStatus}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  Total Net Pay: Rs.{" "}
                                  {period.totalNetPay?.toFixed(2) || "0.00"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Total CTC: Rs.{" "}
                                  {period.totalCTC?.toFixed(2) || "0.00"}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {payrollHistory.length > 0 &&
                          filteredPayrollHistory.length === 0 && (
                            <div className="text-center py-12">
                              <p className="text-gray-600">
                                No payroll periods match your search
                              </p>
                            </div>
                          )}

                        {selectedMonthHistory && selectedYearHistory && (
                          <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold">
                                  Payroll Details - {selectedMonthHistory}{" "}
                                  {selectedYearHistory}
                                  {isEditable(
                                    selectedMonthHistory,
                                    selectedYearHistory
                                  ) && (
                                    <Badge variant="success" className="ml-2">
                                      Editable
                                    </Badge>
                                  )}
                                </h3>
                                <div className="relative w-64">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search employees..."
                                    value={searchTermPayroll}
                                    onChange={(e) =>
                                      setSearchTermPayroll(e.target.value)
                                    }
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={refreshPayrollDetails}
                                  disabled={refreshingPayrollDetails}
                                  className="flex items-center gap-2"
                                >
                                  <RefreshCw
                                    className={`h-4 w-4 ${
                                      refreshingPayrollDetails
                                        ? "animate-spin"
                                        : ""
                                    }`}
                                  />
                                  Refresh Details
                                </Button>
                                {isEditable(
                                  selectedMonthHistory,
                                  selectedYearHistory
                                ) && (
                                  <>
                                    {hasEdits && (
                                      <Button
                                        onClick={handleBulkSavePayrollEdits}
                                        disabled={savingEdits}
                                        className="flex items-center gap-2"
                                      >
                                        {savingEdits ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                          </>
                                        ) : (
                                          <>
                                            Save All Changes (
                                            {
                                              Object.keys(editingPayrollData)
                                                .length
                                            }
                                            )
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      onClick={handleRerunPayroll}
                                      disabled={rerunLoading}
                                      className="flex items-center gap-2"
                                    >
                                      {rerunLoading ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                          Rerunning...
                                        </>
                                      ) : (
                                        "Rerun Payroll"
                                      )}
                                    </Button>
                                  </>
                                )}
                                {!isEditable(
                                  selectedMonthHistory,
                                  selectedYearHistory
                                ) && (
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeletePayroll(
                                        selectedMonthHistory,
                                        selectedYearHistory
                                      )
                                    }
                                    disabled={
                                      deletingPayroll ===
                                      `${selectedMonthHistory}-${selectedYearHistory}`
                                    }
                                  >
                                    {deletingPayroll ===
                                    `${selectedMonthHistory}-${selectedYearHistory}` ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Deleting...
                                      </>
                                    ) : (
                                      "Delete Payroll"
                                    )}
                                  </Button>
                                )}
                                {!isEditable(
                                  selectedMonthHistory,
                                  selectedYearHistory
                                ) && (
                                  <Badge variant="secondary">Read Only</Badge>
                                )}
                              </div>
                            </div>

                            {currentPayroll.length > 0 ? (
                              <div className="overflow-x-auto border rounded-lg">
                                {filteredCurrentPayroll.length > 0 ? (
                                  <Table>
                                    <TableHeader className="bg-gray-100">
                                      <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">
                                          CTC (Annual)
                                        </TableHead>
                                        <TableHead className="text-right">
                                          Gross Earnings
                                        </TableHead>
                                        <TableHead className="text-right">
                                          Deductions
                                        </TableHead>
                                        <TableHead className="text-right">
                                          Net Pay
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {filteredCurrentPayroll.map((payroll) => {
                                        const isEdited =
                                          editingPayrollData[payroll._id];
                                        const netPay = payroll.netPay;
                                        const editable = isEditable(
                                          selectedMonthHistory,
                                          selectedYearHistory
                                        );
                                        const isExpanded =
                                          expandedRows[payroll._id];

                                        return (
                                          <React.Fragment key={payroll._id}>
                                            <TableRow
                                              className={
                                                isEdited ? "bg-blue-50" : ""
                                              }
                                            >
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    toggleExpandedRow(
                                                      payroll._id
                                                    )
                                                  }
                                                  className="h-8 w-8 p-0"
                                                >
                                                  {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                  )}
                                                </Button>
                                              </TableCell>
                                              <TableCell>
                                                <div>
                                                  <div className="font-medium">
                                                    {
                                                      payroll.employeeDetails
                                                        ?.name
                                                    }
                                                  </div>
                                                  <div className="text-sm text-gray-500">
                                                    {payroll.employeeId}
                                                  </div>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {editable ? (
                                                  <Input
                                                    type="number"
                                                    value={getSafeValue(
                                                      payroll,
                                                      payroll._id,
                                                      "ctc"
                                                    )}
                                                    onChange={(e) =>
                                                      handlePayrollFieldChange(
                                                        payroll._id,
                                                        "ctc",
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-32 text-right"
                                                  />
                                                ) : (
                                                  `Rs. ${(
                                                    payroll.ctc || 0
                                                  ).toLocaleString()}`
                                                )}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                Rs.{" "}
                                                {payroll.grossEarnings.toFixed(
                                                  2
                                                )}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                Rs.{" "}
                                                {payroll.totalDeductions.toFixed(
                                                  2
                                                )}
                                              </TableCell>
                                              <TableCell className="text-right font-semibold">
                                                {/* FIXED: Only show amount in payroll history table */}
                                                {formatNetPayAmountOnly(netPay)}
                                                {isEdited &&
                                                  netPay !== payroll.netPay && (
                                                    <div className="text-xs text-green-600">
                                                      (Originally: Rs.{" "}
                                                      {payroll.netPay.toFixed(
                                                        2
                                                      )}
                                                      )
                                                    </div>
                                                  )}
                                              </TableCell>
                                              <TableCell>
                                                <Badge
                                                  variant={
                                                    payroll.status === "paid"
                                                      ? "default"
                                                      : payroll.status ===
                                                        "processed"
                                                      ? "secondary"
                                                      : "outline"
                                                  }
                                                >
                                                  {payroll.status}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex gap-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGeneratePayslip(
                                                        payroll._id,
                                                        payroll.employeeDetails
                                                          ?.name
                                                      )
                                                    }
                                                    disabled={
                                                      generatingPayslip ===
                                                      payroll._id
                                                    }
                                                  >
                                                    {generatingPayslip ===
                                                    payroll._id ? (
                                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                    ) : (
                                                      "Payslip"
                                                    )}
                                                  </Button>
                                                  {editable && isEdited && (
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() =>
                                                        handleSavePayrollEdits(
                                                          payroll._id
                                                        )
                                                      }
                                                      disabled={savingEdits}
                                                    >
                                                      Save
                                                    </Button>
                                                  )}
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                              <TableRow className="bg-gray-50">
                                                <TableCell colSpan={8}>
                                                  <div className="p-4 space-y-4">
                                                    {/* Earnings Breakdown */}
                                                    <div>
                                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <IndianRupee className="w-4 h-4 text-green-600" />
                                                        Earnings Breakdown
                                                      </h4>
                                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Basic Salary
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "basicSalary"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "basicSalary",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.basicSalary.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            HRA
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "hra"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "hra",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.hra.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Fixed Allowance
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "fixedAllowance"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "fixedAllowance",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.fixedAllowance.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Conveyance
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "conveyanceAllowance"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "conveyanceAllowance",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.conveyanceAllowance.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Children Education
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "childrenEducationAllowance"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "childrenEducationAllowance",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.childrenEducationAllowance.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Medical
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "medicalAllowance"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "medicalAllowance",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.medicalAllowance.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Shift Allowance
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "shiftAllowance"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "shiftAllowance",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.shiftAllowance.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Mobile/Internet
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "mobileInternetAllowance"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "mobileInternetAllowance",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.mobileInternetAllowance.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {/* Deductions Breakdown */}
                                                    <div>
                                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-red-600" />
                                                        Deductions Breakdown
                                                      </h4>
                                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Employee EPF
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "employeeEPF"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "employeeEPF",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.employeeEPF.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Employee ESI
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "employeeESI"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "employeeESI",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.employeeESI.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm font-medium text-gray-600">
                                                            Professional Tax
                                                          </Label>
                                                          {editable ? (
                                                            <Input
                                                              type="number"
                                                              value={getSafeValue(
                                                                payroll,
                                                                payroll._id,
                                                                "professionalTax"
                                                              )}
                                                              onChange={(e) =>
                                                                handlePayrollFieldChange(
                                                                  payroll._id,
                                                                  "professionalTax",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1"
                                                            />
                                                          ) : (
                                                            <div className="text-lg font-semibold mt-1">
                                                              Rs.{" "}
                                                              {payroll.professionalTax.toFixed(
                                                                2
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <div className="text-center py-8">
                                    <p className="text-gray-600">
                                      No payroll records match your search
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 border rounded-lg bg-gray-50">
                                <p className="text-gray-600">
                                  No payroll data found for{" "}
                                  {selectedMonthHistory} {selectedYearHistory}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-600">
                          No payroll history found
                        </p>
                        <Button
                          onClick={() => setActiveTab("run")}
                          className="mt-4"
                        >
                          Run First Payroll
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollSection;
