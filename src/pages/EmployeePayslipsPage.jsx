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
  Download,
  FileText,
  Calendar,
  User,
  IndianRupee,
  Filter,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth

const EmployeePayslipsPage = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingPayslip, setGeneratingPayslip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

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

  // Fetch employee's payslips
  const fetchEmployeePayslips = async () => {
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

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/payroll/employee-payslips/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setPayslips([]);
          toast({
            title: "Info",
            description: "No payslips found for your account",
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPayslips(data || []);

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

  useEffect(() => {
    if (user) {
      fetchEmployeePayslips();
    }
  }, [user]);

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

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let words = formatNumber(integerPart);
    words += " Only";

    return words;
  };

  // Generate PDF payslip
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payslipData = await response.json();
      generatePDF(payslipData, employeeName, month, year);

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

  const generatePDF = (payslipData, employeeName, month, year) => {
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

      payslipData.earningsBreakdown.forEach((earning) => {
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
      payslipData.deductionsBreakdown.forEach((deduction) => {
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

    // Net Pay Section
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

    const totalWidth = labelWidth + amountWidth + wordsWidth + 10;
    const availableWidth = rightMargin - leftMargin - 10;

    if (totalWidth <= availableWidth) {
      // Everything fits on one line
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
    doc.save(`payslip-${employeeName}-${month}-${year}.pdf`);
  };

  // Filter payslips based on search and filters
  const filteredPayslips = payslips.filter((payslip) => {
    const matchesSearch =
      searchTerm === "" ||
      payslip.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.year.toString().includes(searchTerm) ||
      payslip.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth =
      selectedMonth === "" || payslip.month === selectedMonth;
    const matchesYear =
      selectedYear === "" || payslip.year.toString() === selectedYear;

    return matchesSearch && matchesMonth && matchesYear;
  });

  // Get status color
  const getStatusColor = (status) => {
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get employee ID for display
  const employeeId = user?.employeeId || user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              My Payslips
            </h1>
            <p className="text-gray-600 mt-2">
              View and download your salary payslips
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Employee ID: {employeeId || "Loading..."}</span>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payslip History
              {!loading && (
                <Badge variant="secondary" className="ml-2">
                  {filteredPayslips.length} payslips
                </Badge>
              )}
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payslips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Button
                onClick={fetchEmployeePayslips}
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
              <p className="mt-4 text-gray-600">Loading your payslips...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayslips.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayslips.map((payslip) => (
                        <TableRow
                          key={payslip._id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="font-medium">
                              {payslip.month} {payslip.year}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payslip.status)}>
                              {payslip.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {formatDate(payslip.updatedAt)}
                            </div>
                          </TableCell>
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
                                <>
                                  <Download className="w-3 h-3" />
                                  Download
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Payslips Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {payslips.length === 0
                      ? "You don't have any payslips yet. Payslips will appear here once payroll is processed for you."
                      : "No payslips match your current filters."}
                  </p>
                  {(searchTerm || selectedMonth || selectedYear) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedMonth("all");
                        setSelectedYear("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {/* Summary Card */}
              {filteredPayslips.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredPayslips.length}
                        </div>
                        <div className="text-sm text-blue-800">
                          Total Payslips
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          Rs.{" "}
                          {filteredPayslips
                            .reduce((sum, p) => sum + (p.netPay || 0), 0)
                            .toFixed(2)}
                        </div>
                        <div className="text-sm text-green-800">
                          Total Net Pay
                        </div>
                      </div>
                      {/* <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {
                            filteredPayslips.filter((p) => p.status === "paid")
                              .length
                          }
                        </div>
                        <div className="text-sm text-purple-800">Paid</div>
                      </div> */}
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {new Set(filteredPayslips.map((p) => p.year)).size}
                        </div>
                        <div className="text-sm text-orange-800">Years</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmployeePayslipsPage;
