import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
import { Search, RefreshCw } from "lucide-react";

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

  // API base URL - change this based on your environment
  const API_BASE =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
    fetchLastPayrollRun();
  }, []);

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

  // NEW: Refresh payroll history with loading state
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
      setSearchTermPayroll(""); // Reset search when loading new payroll
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      setCurrentPayroll([]);
      setCurrentPayrollMeta({});
    }
  };

  // NEW: Refresh current payroll details with loading state
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

      // Refresh data
      fetchPayrollHistory();
      fetchLastPayrollRun();

      // Clear current selection if it was deleted
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

    const employeesWithoutSalary = employees.filter(
      (emp) =>
        emp.basicSalary === 0 && emp.allowances === 0 && emp.deductions === 0
    );

    if (employeesWithoutSalary.length > 0) {
      toast({
        title: "Warning",
        description: `${employeesWithoutSalary.length} employees have zero salary. Please set salaries first.`,
        variant: "destructive",
      });
      setActiveTab("employees");
      return;
    }

    try {
      setRunPayrollLoading(true);
      const response = await fetch(`${API_BASE}/api/payroll/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setPayrollResults(data);
      setShowPayrollResults(true);

      toast({
        title: "Success",
        description: `${data.message} (${data.createdCount} created, ${data.updatedCount} updated)`,
      });

      fetchPayrollHistory();
      fetchLastPayrollRun();
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
      fetchEmployees(); // Refresh employee salaries
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

  // FIXED: Properly handle number parsing with validation and preserve all fields
  const handlePayrollFieldChange = (payrollId, field, value) => {
    // Ensure value is a valid number, default to 0 if invalid
    const numericValue = parseFloat(value);
    const safeValue = isNaN(numericValue) ? 0 : numericValue;

    setEditingPayrollData((prev) => {
      const currentEdits = prev[payrollId] || {};
      const payroll = currentPayroll.find((p) => p._id === payrollId);

      // Preserve all current values and update only the changed field
      return {
        ...prev,
        [payrollId]: {
          basicSalary:
            currentEdits.basicSalary !== undefined
              ? currentEdits.basicSalary
              : payroll.basicSalary,
          allowances:
            currentEdits.allowances !== undefined
              ? currentEdits.allowances
              : payroll.allowances,
          deductions:
            currentEdits.deductions !== undefined
              ? currentEdits.deductions
              : payroll.deductions,
          [field]: safeValue,
        },
      };
    });
  };

  // FIXED: Validate all fields before saving and refresh data
  const handleSavePayrollEdits = async (payrollId) => {
    const edits = editingPayrollData[payrollId];
    if (!edits) return;

    // Validate all fields have valid numbers
    const validatedEdits = {
      basicSalary:
        edits.basicSalary !== undefined && !isNaN(edits.basicSalary)
          ? edits.basicSalary
          : 0,
      allowances:
        edits.allowances !== undefined && !isNaN(edits.allowances)
          ? edits.allowances
          : 0,
      deductions:
        edits.deductions !== undefined && !isNaN(edits.deductions)
          ? edits.deductions
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

      // Refresh all data to sync changes
      fetchPayrollByMonth(selectedMonthHistory, selectedYearHistory);
      fetchEmployees(); // Refresh Manage Salaries section
      fetchPayrollHistory(); // Refresh payroll history cards
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

  // FIXED: Validate all fields in bulk update and refresh data
  const handleBulkSavePayrollEdits = async () => {
    const updates = Object.keys(editingPayrollData).map((payrollId) => {
      const edits = editingPayrollData[payrollId];
      return {
        payrollId,
        basicSalary:
          edits.basicSalary !== undefined && !isNaN(edits.basicSalary)
            ? edits.basicSalary
            : 0,
        allowances:
          edits.allowances !== undefined && !isNaN(edits.allowances)
            ? edits.allowances
            : 0,
        deductions:
          edits.deductions !== undefined && !isNaN(edits.deductions)
            ? edits.deductions
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
      // Refresh all data to sync changes
      fetchPayrollByMonth(selectedMonthHistory, selectedYearHistory);
      fetchEmployees(); // Refresh Manage Salaries section
      fetchPayrollHistory(); // Refresh payroll history cards
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

  const handleUpdateSalary = async (
    employeeId,
    basicSalary,
    allowances,
    deductions
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/payroll/salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          basicSalary: parseFloat(basicSalary) || 0,
          allowances: parseFloat(allowances) || 0,
          deductions: parseFloat(deductions) || 0,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      toast({
        title: "Success",
        description: `Salary updated for ${data.employee?.name || employeeId}`,
      });

      fetchEmployees();
    } catch (error) {
      console.error("Error updating salary:", error);
      toast({
        title: "Error",
        description: "Failed to update salary",
        variant: "destructive",
      });
    }
  };

  const handleSalaryFieldChange = (employeeId, field, value) => {
    const numericValue = parseFloat(value);
    const safeValue = isNaN(numericValue) ? 0 : numericValue;

    setSalaryEdits((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: safeValue,
      },
    }));
  };

  const handleSaveSalary = async (employeeId) => {
    const edits = salaryEdits[employeeId];
    if (!edits) return;

    const employee = employees.find((emp) => emp.employeeId === employeeId);
    if (!employee) return;

    const basicSalary =
      edits.basicSalary !== undefined
        ? edits.basicSalary
        : employee.basicSalary;
    const allowances =
      edits.allowances !== undefined ? edits.allowances : employee.allowances;
    const deductions =
      edits.deductions !== undefined ? edits.deductions : employee.deductions;

    await handleUpdateSalary(employeeId, basicSalary, allowances, deductions);

    // Clear the edits for this employee
    setSalaryEdits((prev) => {
      const newEdits = { ...prev };
      delete newEdits[employeeId];
      return newEdits;
    });
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

    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 128);
    doc.text("Cybomb Technologies Pvt Ltd", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PAYSLIP", 105, 30, { align: "center" });

    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // Employee Details
    doc.setFontSize(10);
    doc.text(`Employee Name: ${payslipData.employeeName}`, 20, 45);
    doc.text(`Employee ID: ${payslipData.employeeId}`, 20, 52);
    doc.text(`Department: ${payslipData.department}`, 20, 59);
    doc.text(`Designation: ${payslipData.designation}`, 20, 66);
    doc.text(`Employment Type: ${payslipData.employmentType}`, 20, 73);
    doc.text(`Location: ${payslipData.location}`, 20, 80);
    doc.text(`Month: ${payslipData.month} ${payslipData.year}`, 20, 87);

    // Add line separator
    doc.line(20, 95, 190, 95);

    // Salary Breakdown - Using "Rs." instead of rupee symbol for PDF compatibility
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("SALARY BREAKDOWN", 20, 105);
    doc.setFont(undefined, "normal");

    doc.setFontSize(10);
    doc.text(
      `Basic Salary: Rs. ${payslipData.basicSalary.toFixed(2)}`,
      30,
      115
    );
    doc.text(`Allowances: Rs. ${payslipData.allowances.toFixed(2)}`, 30, 122);
    doc.text(`Deductions: Rs. ${payslipData.deductions.toFixed(2)}`, 30, 129);

    // Add line for total
    doc.setDrawColor(100, 100, 100);
    doc.line(25, 136, 85, 136);

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`NET PAY: Rs. ${payslipData.netPay.toFixed(2)}`, 30, 145);
    doc.setFont(undefined, "normal");

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${payslipData.generatedDate}`, 20, 160);
    doc.text("This is a computer generated payslip", 105, 170, {
      align: "center",
    });
    doc.text("No signature required", 105, 175, { align: "center" });

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

  // FIXED: Remove the hardcoded condition for October 2025 - ONLY CHANGE MADE
  const isEditable = (month, year) => {
    return isCurrentMonth(month, year);
  };

  const hasEdits = Object.keys(editingPayrollData).length > 0;

  // FIXED: Safe net pay calculation
  const calculateNetPay = (payroll, payrollId) => {
    const edits = editingPayrollData[payrollId];
    if (edits) {
      const basic =
        edits.basicSalary !== undefined && !isNaN(edits.basicSalary)
          ? edits.basicSalary
          : payroll.basicSalary;
      const allowances =
        edits.allowances !== undefined && !isNaN(edits.allowances)
          ? edits.allowances
          : payroll.allowances;
      const deductions =
        edits.deductions !== undefined && !isNaN(edits.deductions)
          ? edits.deductions
          : payroll.deductions;
      return basic + allowances - deductions;
    }
    return payroll.netPay;
  };

  // FIXED: Get safe value for input display
  const getSafeValue = (payroll, payrollId, field) => {
    const edits = editingPayrollData[payrollId];
    if (edits && edits[field] !== undefined && !isNaN(edits[field])) {
      return edits[field];
    }
    return payroll[field];
  };

  // FIXED: Get safe salary value for input display
  const getSafeSalaryValue = (employee, field) => {
    const edits = salaryEdits[employee.employeeId];
    if (edits && edits[field] !== undefined && !isNaN(edits[field])) {
      return edits[field];
    }
    return employee[field];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage employee salaries and process payroll
          </p>
        </div>
        <div className="flex gap-2">
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
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center gap-2">
                <span>Manage Employee Salaries</span>
                {!loading && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredEmployees.length} of {employees.length} employees
                  </Badge>
                )}
              </CardTitle>
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
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading employees data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {employees.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead className="font-semibold">
                          Employee ID
                        </TableHead>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">
                          Department
                        </TableHead>
                        <TableHead className="font-semibold">
                          Designation
                        </TableHead>
                        <TableHead className="font-semibold">
                          Employment Type
                        </TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">
                          Basic Salary (₹)
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Allowances (₹)
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Deductions (₹)
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Net Pay (₹)
                        </TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee, index) => {
                        const hasSalaryEdits = salaryEdits[employee.employeeId];
                        const currentBasic = getSafeSalaryValue(
                          employee,
                          "basicSalary"
                        );
                        const currentAllowances = getSafeSalaryValue(
                          employee,
                          "allowances"
                        );
                        const currentDeductions = getSafeSalaryValue(
                          employee,
                          "deductions"
                        );
                        const currentNetPay =
                          currentBasic + currentAllowances - currentDeductions;

                        return (
                          <TableRow
                            key={employee.employeeId}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <TableCell className="font-medium">
                              {employee.employeeId}
                            </TableCell>
                            <TableCell className="font-medium">
                              {employee.name}
                            </TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>{employee.designation}</TableCell>
                            <TableCell>{employee.employmentType}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  employee.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {employee.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={currentBasic}
                                onChange={(e) =>
                                  handleSalaryFieldChange(
                                    employee.employeeId,
                                    "basicSalary",
                                    e.target.value
                                  )
                                }
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={currentAllowances}
                                onChange={(e) =>
                                  handleSalaryFieldChange(
                                    employee.employeeId,
                                    "allowances",
                                    e.target.value
                                  )
                                }
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={currentDeductions}
                                onChange={(e) =>
                                  handleSalaryFieldChange(
                                    employee.employeeId,
                                    "deductions",
                                    e.target.value
                                  )
                                }
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{currentNetPay.toFixed(2)}
                              {hasSalaryEdits &&
                                currentNetPay !== employee.netPay && (
                                  <div className="text-xs text-green-600">
                                    (Originally: ₹{employee.netPay.toFixed(2)})
                                  </div>
                                )}
                            </TableCell>
                            <TableCell>
                              {hasSalaryEdits && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSaveSalary(employee.employeeId)
                                  }
                                >
                                  Save
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No employees found</p>
                  </div>
                )}
                {employees.length > 0 && filteredEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      No employees match your search
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "run" && (
        <div className="space-y-6">
          {!showPayrollResults ? (
            <>
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-xl">Run New Payroll</CardTitle>
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
                            • This will process payroll for{" "}
                            <strong>{employees.length}</strong> active employees
                          </li>
                          <li>
                            • Ensures compliance with all statutory payroll
                            requirements
                          </li>
                          <li>
                            • Payroll records will be created or updated for the
                            selected period
                          </li>
                          {selectedMonth &&
                            selectedYear &&
                            isCurrentMonth(selectedMonth, selectedYear) && (
                              <li className="text-green-700 font-semibold">
                                • This is current month payroll - edit and rerun
                                features will be available
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
                        runPayrollLoading || !selectedMonth || !selectedYear
                      }
                      className="px-6 py-2"
                    >
                      {runPayrollLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing Payroll...
                        </>
                      ) : (
                        "Run Payroll"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMonth("");
                        setSelectedYear(new Date().getFullYear());
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
                          ₹
                          {lastPayrollRun.summary.totalNetPay?.toFixed(2) ||
                            "0.00"}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Net Pay
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {lastPayrollRun.period.month}
                        </div>
                        <div className="text-sm text-gray-600">Month</div>
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
                      <div className="text-sm text-gray-600 mt-1">Created</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {payrollResults.updatedCount}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Updated</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Period:</strong> {selectedMonth} {selectedYear}
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
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => {
                        setActiveTab("history");
                        fetchPayrollByMonth(selectedMonth, selectedYear);
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

      {activeTab === "history" && (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>Payroll History</span>
                  {!payrollHistoryLoading && (
                    <Badge variant="secondary" className="ml-2">
                      {filteredPayrollHistory.length} of {payrollHistory.length}{" "}
                      periods
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
                                  {/* FIXED: Only show Editable badge for current month */}
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
                                Total Net Pay: ₹
                                {period.totalNetPay?.toFixed(2) || "0.00"}
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
                                {/* FIXED: Only show Editable badge for current month */}
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
                              {/* FIXED: Only show edit buttons for current month */}
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
                              {/* DELETE BUTTON - Only show for non-current months */}
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
                              ) && <Badge variant="secondary">Read Only</Badge>}
                            </div>
                          </div>

                          {currentPayroll.length > 0 ? (
                            <div className="overflow-x-auto border rounded-lg">
                              {filteredCurrentPayroll.length > 0 ? (
                                <Table>
                                  <TableHeader className="bg-gray-100">
                                    <TableRow>
                                      <TableHead>Employee</TableHead>
                                      <TableHead className="text-right">
                                        Basic Salary
                                      </TableHead>
                                      <TableHead className="text-right">
                                        Allowances
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
                                      const netPay = calculateNetPay(
                                        payroll,
                                        payroll._id
                                      );
                                      // FIXED: Use isEditable function instead of hardcoded value
                                      const editable = isEditable(
                                        selectedMonthHistory,
                                        selectedYearHistory
                                      );

                                      return (
                                        <TableRow
                                          key={payroll._id}
                                          className={
                                            isEdited ? "bg-blue-50" : ""
                                          }
                                        >
                                          <TableCell>
                                            <div>
                                              <div className="font-medium">
                                                {payroll.employeeDetails?.name}
                                              </div>
                                              <div className="text-sm text-gray-500">
                                                {payroll.employeeId}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {/* FIXED: Only show inputs for current month */}
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
                                                className="w-24 text-right"
                                              />
                                            ) : (
                                              `₹${payroll.basicSalary.toFixed(
                                                2
                                              )}`
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {/* FIXED: Only show inputs for current month */}
                                            {editable ? (
                                              <Input
                                                type="number"
                                                value={getSafeValue(
                                                  payroll,
                                                  payroll._id,
                                                  "allowances"
                                                )}
                                                onChange={(e) =>
                                                  handlePayrollFieldChange(
                                                    payroll._id,
                                                    "allowances",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-24 text-right"
                                              />
                                            ) : (
                                              `₹${payroll.allowances.toFixed(
                                                2
                                              )}`
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {/* FIXED: Only show inputs for current month */}
                                            {editable ? (
                                              <Input
                                                type="number"
                                                value={getSafeValue(
                                                  payroll,
                                                  payroll._id,
                                                  "deductions"
                                                )}
                                                onChange={(e) =>
                                                  handlePayrollFieldChange(
                                                    payroll._id,
                                                    "deductions",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-24 text-right"
                                              />
                                            ) : (
                                              `₹${payroll.deductions.toFixed(
                                                2
                                              )}`
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">
                                            ₹{netPay.toFixed(2)}
                                            {isEdited &&
                                              netPay !== payroll.netPay && (
                                                <div className="text-xs text-green-600">
                                                  (Originally: ₹
                                                  {payroll.netPay.toFixed(2)})
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
                                              {/* FIXED: Only show Save button for current month */}
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
                                No payroll data found for {selectedMonthHistory}{" "}
                                {selectedYearHistory}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No payroll history found</p>
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
  );
};

export default PayrollSection;
