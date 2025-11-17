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
  Building,
  User,
  IndianRupee,
  Eye,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useCurrency } from "../contexts/CurrencyContext";

const EmployeePayslipsPage = () => {
  const {
    currency,
    formatAmount,
    formatAmountWithoutConversion,
    formatHistoricalAmount,
    convertAmount,
    loading: currencyLoading,
  } = useCurrency();

  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [previewPayslip, setPreviewPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingPayslip, setGeneratingPayslip] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const API_BASE =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

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

  // Function to convert number to words (same as PayrollSection.jsx)
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

  // Function to format Net Pay display for employee cards (amount only) - same as PayrollSection.jsx
  const formatNetPayAmountOnly = (
    amount,
    payrollCurrency = null,
    isCurrentMonth = false
  ) => {
    const numericAmount =
      typeof amount === "number" ? amount : parseFloat(amount) || 0;

    if (isCurrentMonth) {
      // Current month: show converted amount
      return formatAmount(numericAmount);
    } else {
      // Historical data: ALWAYS use original currency symbol if available
      if (payrollCurrency && payrollCurrency.symbol) {
        return `${payrollCurrency.symbol} ${numericAmount.toFixed(2)}`;
      } else {
        // Fallback to current currency (shouldn't happen for historical data)
        return formatAmountWithoutConversion(numericAmount);
      }
    }
  };

  // Check if payslip is for current month
  const isCurrentMonth = (month, year) => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString("en-US", { month: "long" });
    const currentYear = currentDate.getFullYear();
    return month === currentMonth && year === currentYear;
  };

  // Toggle expanded row
  const toggleExpandedRow = (payslipId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [payslipId]: !prev[payslipId],
    }));
  };

  // Fetch employee's payslips
  const fetchPayslips = async () => {
    try {
      setLoading(true);

      // Get employee ID from localStorage or context (adjust based on your auth system)
      const employeeId = localStorage.getItem("employeeId") || "EMP001"; // Replace with actual employee ID from your auth system

      const response = await fetch(
        `${API_BASE}/api/payroll/employee-payslips/${employeeId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPayslips(data);
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

  // Generate PDF for preview (same as download but returns blob URL)
  const generatePDFPreview = async (payslipData, employeeName) => {
    return new Promise((resolve) => {
      const doc = new jsPDF();

      // Set margins and starting position
      const leftMargin = 20;
      const rightMargin = 190;
      let yPosition = 20;

      // Use the company details from payslip data (historical)
      const companyDetails = payslipData.companyDetails;
      const displayCurrency = payslipData.currency || currency;

      // Company Header - Left Side (using historical company details)
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(companyDetails.name, leftMargin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      // Build address from stored company details
      const addressLine1 = companyDetails.address.street;
      const addressLine2 = `${companyDetails.address.city}, ${companyDetails.address.state} - ${companyDetails.address.zipCode}, ${companyDetails.address.country}`;

      doc.text(addressLine1, leftMargin, yPosition);
      yPosition += 5;
      doc.text(addressLine2, leftMargin, yPosition);
      yPosition += 5;

      // Logo Section - Right Side (using uploaded logo from company settings)
      const logoX = 150;
      const logoY = 16;
      const logoSize = 22;

      if (companyDetails.logo) {
        // If logo URL exists, add the image to the PDF
        try {
          // Create an image element to get dimensions
          const img = new Image();
          img.src = companyDetails.logo;

          // Set a timeout to handle image loading
          setTimeout(() => {
            try {
              // Calculate dimensions to fit in the logo area while maintaining aspect ratio
              const maxWidth = logoSize;
              const maxHeight = logoSize;

              // Use natural dimensions if available, otherwise use default
              const imgWidth = img.naturalWidth || 100;
              const imgHeight = img.naturalHeight || 100;

              // Calculate aspect ratio
              const aspectRatio = imgWidth / imgHeight;

              let width, height;

              if (imgWidth > imgHeight) {
                // Landscape image
                width = Math.min(maxWidth, imgWidth);
                height = width / aspectRatio;
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * aspectRatio;
                }
              } else {
                // Portrait or square image
                height = Math.min(maxHeight, imgHeight);
                width = height * aspectRatio;
                if (width > maxWidth) {
                  width = maxWidth;
                  height = width / aspectRatio;
                }
              }

              // Center the logo in the logo area
              const centerX = logoX + (logoSize - width) / 2;
              const centerY = logoY + (logoSize - height) / 2;

              // Add the image to the PDF
              doc.addImage(
                companyDetails.logo,
                "JPEG",
                centerX,
                centerY,
                width,
                height
              );

              // Continue with the rest of the PDF generation
              continuePDFGeneration();
            } catch (error) {
              console.error("Error processing logo image:", error);
              addFallbackLogo();
            }
          }, 100);
        } catch (error) {
          console.error("Error adding logo to PDF:", error);
          addFallbackLogo();
        }
      } else {
        addFallbackLogo();
      }

      function addFallbackLogo() {
        // Fallback to black square with text if logo fails to load or doesn't exist
        doc.setFillColor(0, 0, 0);
        doc.rect(logoX, logoY, logoSize, logoSize, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont(undefined, "bold");

        const companyNameParts = companyDetails.name.split(" ");
        const companyNameLine1 = companyNameParts[0] || "Company";
        const companyNameLine2 = companyNameParts.slice(1).join(" ") || "Name";

        const textWidth1 = doc.getTextWidth(companyNameLine1);
        const textWidth2 = doc.getTextWidth(companyNameLine2);
        const centerX1 = logoX + (logoSize - textWidth1) / 2;
        const centerX2 = logoX + (logoSize - textWidth2) / 2;

        doc.text(companyNameLine1, centerX1, logoY + 10);
        doc.text(companyNameLine2, centerX2, logoY + 14);

        // Reset text color
        doc.setTextColor(0, 0, 0);
        continuePDFGeneration();
      }

      function continuePDFGeneration() {
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
        doc.text(
          `Employee ID: ${payslipData.employeeId}`,
          leftMargin,
          yPosition
        );
        yPosition += 7;
        doc.text(
          `Designation: ${payslipData.designation}`,
          leftMargin,
          yPosition
        );
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
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 8, "F");

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text("EARNINGS", leftMargin + 5, yPosition + 6);
          yPosition += 12;

          doc.setFontSize(10);
          doc.setFont(undefined, "normal");

          payslipData.earningsBreakdown.forEach((earning, index) => {
            doc.text(`${earning.name}:`, leftMargin + 5, yPosition);
            doc.text(
              `${displayCurrency.symbol} ${earning.amount.toFixed(2)}`,
              rightMargin - 10,
              yPosition,
              { align: "right" }
            );
            yPosition += 7;
          });

          doc.setDrawColor(200, 200, 200);
          doc.line(leftMargin, yPosition, rightMargin, yPosition);
          yPosition += 5;

          doc.setFont(undefined, "bold");
          doc.text(`Gross Earnings:`, leftMargin + 5, yPosition);
          doc.text(
            `${displayCurrency.symbol} ${payslipData.grossEarnings.toFixed(2)}`,
            rightMargin - 10,
            yPosition,
            { align: "right" }
          );
          doc.setFont(undefined, "normal");
          yPosition += 8;
        }

        // Deductions Section
        if (payslipData.deductionsBreakdown.length > 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 8, "F");

          doc.setFont(undefined, "bold");
          doc.text("DEDUCTIONS", leftMargin + 5, yPosition + 6);
          doc.setFont(undefined, "normal");
          yPosition += 12;

          doc.setFontSize(10);
          payslipData.deductionsBreakdown.forEach((deduction, index) => {
            doc.text(`${deduction.name}:`, leftMargin + 5, yPosition);
            doc.text(
              `${displayCurrency.symbol} ${deduction.amount.toFixed(2)}`,
              rightMargin - 10,
              yPosition,
              { align: "right" }
            );
            yPosition += 7;
          });

          doc.setDrawColor(200, 200, 200);
          doc.line(leftMargin, yPosition, rightMargin, yPosition);
          yPosition += 5;

          doc.setFont(undefined, "bold");
          doc.text(`Total Deductions:`, leftMargin + 5, yPosition);
          doc.text(
            `${displayCurrency.symbol} ${payslipData.totalDeductions.toFixed(
              2
            )}`,
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

        doc.setFillColor(240, 255, 240);
        doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 20, "F");

        const netPayLabel = "Net Pay: ";
        const netPayAmount = `${
          displayCurrency.symbol
        } ${payslipData.netPay.toFixed(2)}`;
        const amountInWords = `(${displayCurrency.code} ${convertNumberToWords(
          payslipData.netPay
        )})`;

        doc.setFontSize(10);

        const labelWidth = doc.getTextWidth(netPayLabel);
        const amountWidth = doc.getTextWidth(netPayAmount);
        const wordsWidth = doc.getTextWidth(amountInWords);

        const totalWidth = labelWidth + amountWidth + wordsWidth + 10;
        const availableWidth = rightMargin - leftMargin - 10;

        if (totalWidth <= availableWidth) {
          doc.text(netPayLabel, leftMargin + 5, yPosition + 8);
          doc.text(netPayAmount, leftMargin + 5 + labelWidth, yPosition + 8);
          doc.text(
            amountInWords,
            leftMargin + 5 + labelWidth + amountWidth + 5,
            yPosition + 8
          );
        } else {
          doc.text(netPayLabel, leftMargin + 5, yPosition + 8);
          doc.text(netPayAmount, leftMargin + 5 + labelWidth, yPosition + 8);
          doc.setFontSize(8);
          doc.text(amountInWords, leftMargin + 5, yPosition + 16);
        }

        doc.setTextColor(0, 0, 0);
        yPosition += 25;

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 20;

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("This is a computer generated payslip", 105, footerY - 5, {
          align: "center",
        });

        // Get PDF as blob and create URL
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        resolve(pdfUrl);
      }
    });
  };

  // Generate PDF for download
  const handleGeneratePayslip = async (
    payrollId,
    employeeName,
    month,
    year
  ) => {
    try {
      setGeneratingPayslip(payrollId);

      // Use the employee-specific endpoint
      const employeeId = localStorage.getItem("employeeId") || "EMP001"; // Replace with actual employee ID
      const response = await fetch(
        `${API_BASE}/api/payroll/employee-payslip/${employeeId}/${month}/${year}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payslipData = await response.json();

      // Generate and download PDF
      const doc = new jsPDF();

      // Set margins and starting position
      const leftMargin = 20;
      const rightMargin = 190;
      let yPosition = 20;

      // Use the company details from payslip data (historical)
      const companyDetails = payslipData.companyDetails;
      const displayCurrency = payslipData.currency || currency;

      // Company Header - Left Side (using historical company details)
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(companyDetails.name, leftMargin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      // Build address from stored company details
      const addressLine1 = companyDetails.address.street;
      const addressLine2 = `${companyDetails.address.city}, ${companyDetails.address.state} - ${companyDetails.address.zipCode}, ${companyDetails.address.country}`;

      doc.text(addressLine1, leftMargin, yPosition);
      yPosition += 5;
      doc.text(addressLine2, leftMargin, yPosition);
      yPosition += 5;

      // Logo Section - Right Side (using uploaded logo from company settings)
      const logoX = 150;
      const logoY = 16;
      const logoSize = 22;

      if (companyDetails.logo) {
        // If logo URL exists, add the image to the PDF
        try {
          // Create an image element to get dimensions
          const img = new Image();
          img.src = companyDetails.logo;

          // Set a timeout to handle image loading
          setTimeout(() => {
            try {
              // Calculate dimensions to fit in the logo area while maintaining aspect ratio
              const maxWidth = logoSize;
              const maxHeight = logoSize;

              // Use natural dimensions if available, otherwise use default
              const imgWidth = img.naturalWidth || 100;
              const imgHeight = img.naturalHeight || 100;

              // Calculate aspect ratio
              const aspectRatio = imgWidth / imgHeight;

              let width, height;

              if (imgWidth > imgHeight) {
                // Landscape image
                width = Math.min(maxWidth, imgWidth);
                height = width / aspectRatio;
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * aspectRatio;
                }
              } else {
                // Portrait or square image
                height = Math.min(maxHeight, imgHeight);
                width = height * aspectRatio;
                if (width > maxWidth) {
                  width = maxWidth;
                  height = width / aspectRatio;
                }
              }

              // Center the logo in the logo area
              const centerX = logoX + (logoSize - width) / 2;
              const centerY = logoY + (logoSize - height) / 2;

              // Add the image to the PDF
              doc.addImage(
                companyDetails.logo,
                "JPEG",
                centerX,
                centerY,
                width,
                height
              );

              // Continue with the rest of the PDF generation
              continuePDFGeneration();
            } catch (error) {
              console.error("Error processing logo image:", error);
              addFallbackLogo();
            }
          }, 100);
        } catch (error) {
          console.error("Error adding logo to PDF:", error);
          addFallbackLogo();
        }
      } else {
        addFallbackLogo();
      }

      function addFallbackLogo() {
        // Fallback to black square with text if logo fails to load or doesn't exist
        doc.setFillColor(0, 0, 0);
        doc.rect(logoX, logoY, logoSize, logoSize, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont(undefined, "bold");

        const companyNameParts = companyDetails.name.split(" ");
        const companyNameLine1 = companyNameParts[0] || "Company";
        const companyNameLine2 = companyNameParts.slice(1).join(" ") || "Name";

        const textWidth1 = doc.getTextWidth(companyNameLine1);
        const textWidth2 = doc.getTextWidth(companyNameLine2);
        const centerX1 = logoX + (logoSize - textWidth1) / 2;
        const centerX2 = logoX + (logoSize - textWidth2) / 2;

        doc.text(companyNameLine1, centerX1, logoY + 10);
        doc.text(companyNameLine2, centerX2, logoY + 14);

        // Reset text color
        doc.setTextColor(0, 0, 0);
        continuePDFGeneration();
      }

      function continuePDFGeneration() {
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
        doc.text(
          `Employee ID: ${payslipData.employeeId}`,
          leftMargin,
          yPosition
        );
        yPosition += 7;
        doc.text(
          `Designation: ${payslipData.designation}`,
          leftMargin,
          yPosition
        );
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
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 8, "F");

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text("EARNINGS", leftMargin + 5, yPosition + 6);
          yPosition += 12;

          doc.setFontSize(10);
          doc.setFont(undefined, "normal");

          payslipData.earningsBreakdown.forEach((earning, index) => {
            doc.text(`${earning.name}:`, leftMargin + 5, yPosition);
            doc.text(
              `${displayCurrency.symbol} ${earning.amount.toFixed(2)}`,
              rightMargin - 10,
              yPosition,
              { align: "right" }
            );
            yPosition += 7;
          });

          doc.setDrawColor(200, 200, 200);
          doc.line(leftMargin, yPosition, rightMargin, yPosition);
          yPosition += 5;

          doc.setFont(undefined, "bold");
          doc.text(`Gross Earnings:`, leftMargin + 5, yPosition);
          doc.text(
            `${displayCurrency.symbol} ${payslipData.grossEarnings.toFixed(2)}`,
            rightMargin - 10,
            yPosition,
            { align: "right" }
          );
          doc.setFont(undefined, "normal");
          yPosition += 8;
        }

        // Deductions Section
        if (payslipData.deductionsBreakdown.length > 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 8, "F");

          doc.setFont(undefined, "bold");
          doc.text("DEDUCTIONS", leftMargin + 5, yPosition + 6);
          doc.setFont(undefined, "normal");
          yPosition += 12;

          doc.setFontSize(10);
          payslipData.deductionsBreakdown.forEach((deduction, index) => {
            doc.text(`${deduction.name}:`, leftMargin + 5, yPosition);
            doc.text(
              `${displayCurrency.symbol} ${deduction.amount.toFixed(2)}`,
              rightMargin - 10,
              yPosition,
              { align: "right" }
            );
            yPosition += 7;
          });

          doc.setDrawColor(200, 200, 200);
          doc.line(leftMargin, yPosition, rightMargin, yPosition);
          yPosition += 5;

          doc.setFont(undefined, "bold");
          doc.text(`Total Deductions:`, leftMargin + 5, yPosition);
          doc.text(
            `${displayCurrency.symbol} ${payslipData.totalDeductions.toFixed(
              2
            )}`,
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

        doc.setFillColor(240, 255, 240);
        doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 20, "F");

        const netPayLabel = "Net Pay: ";
        const netPayAmount = `${
          displayCurrency.symbol
        } ${payslipData.netPay.toFixed(2)}`;
        const amountInWords = `(${displayCurrency.code} ${convertNumberToWords(
          payslipData.netPay
        )})`;

        doc.setFontSize(10);

        const labelWidth = doc.getTextWidth(netPayLabel);
        const amountWidth = doc.getTextWidth(netPayAmount);
        const wordsWidth = doc.getTextWidth(amountInWords);

        const totalWidth = labelWidth + amountWidth + wordsWidth + 10;
        const availableWidth = rightMargin - leftMargin - 10;

        if (totalWidth <= availableWidth) {
          doc.text(netPayLabel, leftMargin + 5, yPosition + 8);
          doc.text(netPayAmount, leftMargin + 5 + labelWidth, yPosition + 8);
          doc.text(
            amountInWords,
            leftMargin + 5 + labelWidth + amountWidth + 5,
            yPosition + 8
          );
        } else {
          doc.text(netPayLabel, leftMargin + 5, yPosition + 8);
          doc.text(netPayAmount, leftMargin + 5 + labelWidth, yPosition + 8);
          doc.setFontSize(8);
          doc.text(amountInWords, leftMargin + 5, yPosition + 16);
        }

        doc.setTextColor(0, 0, 0);
        yPosition += 25;

        // Footer
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

        toast({
          title: "Success",
          description: "Payslip downloaded successfully",
        });
      }
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

  // View payslip preview
  const handleViewPayslipPreview = async (month, year) => {
    try {
      setLoading(true);

      // Get employee ID from localStorage or context
      const employeeId = localStorage.getItem("employeeId") || "EMP001"; // Replace with actual employee ID

      const response = await fetch(
        `${API_BASE}/api/payroll/employee-payslip/${employeeId}/${month}/${year}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payslipData = await response.json();
      setPreviewPayslip(payslipData);

      // Generate PDF preview and get URL
      const pdfPreviewUrl = await generatePDFPreview(
        payslipData,
        payslipData.employeeName
      );
      setPdfUrl(pdfPreviewUrl);
      setShowPreview(true);
    } catch (error) {
      console.error("Error fetching payslip for preview:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payslip details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Close preview and cleanup
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewPayslip(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  // Filter payslips based on search
  const filteredPayslips = payslips.filter((payslip) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      payslip.month?.toLowerCase().includes(term) ||
      payslip.year?.toString().includes(term) ||
      payslip.status?.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    fetchPayslips();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Payslip History
                {!loading && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredPayslips.length} payslips
                  </Badge>
                )}
              </CardTitle>
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
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading payslips...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayslips.length > 0 ? (
                  filteredPayslips.map((payslip) => {
                    const isCurrentMonthPayslip = isCurrentMonth(
                      payslip.month,
                      payslip.year
                    );
                    const isExpanded = expandedRows[payslip._id];

                    return (
                      <Card
                        key={payslip._id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpandedRow(payslip._id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {payslip.month} {payslip.year}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={
                                      payslip.status === "paid"
                                        ? "default"
                                        : payslip.status === "processed"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {payslip.status}
                                  </Badge>
                                  {isCurrentMonthPayslip && (
                                    <Badge
                                      variant="success"
                                      className="text-xs"
                                    >
                                      Current
                                    </Badge>
                                  )}
                                  {payslip.currency &&
                                    payslip.currency.code !== currency.code && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {payslip.currency.code}
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {formatNetPayAmountOnly(
                                    payslip.netPay || 0,
                                    payslip.currency,
                                    isCurrentMonthPayslip
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Net Pay
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewPayslipPreview(
                                      payslip.month,
                                      payslip.year
                                    )
                                  }
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleGeneratePayslip(
                                      payslip._id,
                                      "Employee Name", // Replace with actual employee name
                                      payslip.month,
                                      payslip.year
                                    )
                                  }
                                  disabled={generatingPayslip === payslip._id}
                                >
                                  {generatingPayslip === payslip._id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="font-medium text-gray-600">
                                    Gross Earnings
                                  </div>
                                  <div className="font-semibold">
                                    {formatHistoricalAmount(
                                      payslip.grossEarnings || 0,
                                      payslip.currency,
                                      isCurrentMonthPayslip
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-600">
                                    Deductions
                                  </div>
                                  <div className="font-semibold">
                                    {formatHistoricalAmount(
                                      payslip.totalDeductions || 0,
                                      payslip.currency,
                                      isCurrentMonthPayslip
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-600">
                                    CTC (Annual)
                                  </div>
                                  <div className="font-semibold">
                                    {formatHistoricalAmount(
                                      payslip.ctc || 0,
                                      payslip.currency,
                                      isCurrentMonthPayslip
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-600">
                                    Processed Date
                                  </div>
                                  <div className="font-semibold">
                                    {new Date(
                                      payslip.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {payslip.companyDetails && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                  <div className="text-sm text-gray-600">
                                    <div className="font-medium">
                                      Company at time of processing:
                                    </div>
                                    <div>{payslip.companyDetails.name}</div>
                                    <div className="text-xs">
                                      {payslip.companyDetails.address.street},{" "}
                                      {payslip.companyDetails.address.city}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No payslips found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Your payslips will appear here once processed"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Payslip Preview - {previewPayslip?.month}{" "}
                  {previewPayslip?.year}
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleGeneratePayslip(
                        previewPayslip?._id,
                        previewPayslip?.employeeName,
                        previewPayslip?.month,
                        previewPayslip?.year
                      )
                    }
                    disabled={generatingPayslip === previewPayslip?._id}
                  >
                    {generatingPayslip === previewPayslip?._id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClosePreview}>
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>

              <div className="p-4 h-full">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[70vh] border rounded"
                    title="Payslip Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading PDF preview...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePayslipsPage;
