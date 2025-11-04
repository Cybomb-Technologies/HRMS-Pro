import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Search, Download, FileText, Calendar, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const EmployeePayslipsPage = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingPayslip, setGeneratingPayslip] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

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

  const API_BASE =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);

      // Get employee ID from user context (same pattern as leave system)
      const employeeId = user?.employeeId || user?.id;

      if (!employeeId) {
        toast({
          title: "Error",
          description: "Employee ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/payroll/employee-payslips/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPayslips(data);

      toast({
        title: "Success",
        description: `Loaded ${data.length} payslips`,
      });
    } catch (error) {
      console.error("Error fetching payslips:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payslips",
        variant: "destructive",
      });
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayslips = (payslips, searchTerm) => {
    if (!searchTerm) return payslips;

    const term = searchTerm.toLowerCase();
    return payslips.filter(
      (payslip) =>
        payslip.month?.toLowerCase().includes(term) ||
        payslip.year?.toString().includes(term) ||
        payslip.status?.toLowerCase().includes(term)
    );
  };

  const filteredPayslips = filterPayslips(payslips, searchTerm);

  const handleGeneratePayslip = async (
    payrollId,
    employeeName,
    month,
    year
  ) => {
    try {
      setGeneratingPayslip(payrollId);
      const response = await fetch(
        `${API_BASE}/api/payroll/payslip/${payrollId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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

    // Salary Breakdown
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>;
      case "processed":
        return <Badge variant="secondary">Processed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTotalEarnings = () => {
    return payslips.reduce((total, payslip) => total + payslip.netPay, 0);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-2">
            View and download your salary payslips
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPayslips}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards - Removed Paid card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Payslips
                </p>
                <p className="text-2xl font-bold mt-1">{payslips.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold mt-1">
                  ₹{getTotalEarnings().toFixed(2)}
                </p>
              </div>
              <Download className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Processed</p>
                <p className="text-2xl font-bold mt-1">
                  {payslips.filter((p) => p.status === "processed").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Payslip History</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payslips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payslips...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {payslips.length > 0 ? (
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="font-semibold">Period</TableHead>
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
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Payslip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((payslip, index) => (
                      <TableRow
                        key={payslip._id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">
                              {payslip.month} {payslip.year}
                            </div>
                            <div className="text-sm text-gray-500">
                              Processed:{" "}
                              {new Date(payslip.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{payslip.basicSalary.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{payslip.allowances.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          -₹{payslip.deductions.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ₹{payslip.netPay.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleGeneratePayslip(
                                payslip._id,
                                user?.name || "Employee",
                                payslip.month,
                                payslip.year
                              )
                            }
                            disabled={generatingPayslip === payslip._id}
                            className="flex items-center gap-2"
                          >
                            {generatingPayslip === payslip._id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Payslips Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any payslips yet. Payslips will appear here
                    after payroll processing.
                  </p>
                </div>
              )}
              {payslips.length > 0 && filteredPayslips.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No payslips match your search</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
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
                Payslip Information
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • Payslips are generated after payroll processing each month
                </li>
                <li>• Download payslips for your records and tax purposes</li>
                <li>
                  • Contact HR if you notice any discrepancies in your payslip
                </li>
                {/* <li>
                  • Payslips are typically available by the 5th of each month
                </li> */}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeePayslipsPage;
