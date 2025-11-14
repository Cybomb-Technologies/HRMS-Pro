import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Shield,
  Briefcase,
  Calendar,
  MoreVertical,
  Edit,
  Settings,
  Eye,
  Send,
  RefreshCw,
  Search,
  Download,
  Trash2,
  FileCheck,
  Upload,
  X,
  Bell,
} from "lucide-react";

// ================== Document Viewer Component ==================
const DocumentViewer = ({ documents, stepName, onDeleteDocument }) => {
  const [viewingDocument, setViewingDocument] = useState(null);

  const handleDownload = async (document) => {
    try {
      const response = await fetch(`http://localhost:5000${document.url}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = document.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Download Started",
          description: `${document.filename} is being downloaded.`,
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document) => {
    if (
      window.confirm(`Are you sure you want to delete ${document.filename}?`)
    ) {
      onDeleteDocument(document._id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
        <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Uploaded Documents ({documents.length})
      </Label>
      {documents.map((doc) => (
        <Card key={doc._id} className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.filename}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      doc.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doc.status || "pending"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(`http://localhost:5000${doc.url}`, "_blank")
                }
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(doc)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(doc)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Document Preview Modal */}
      <Dialog
        open={!!viewingDocument}
        onOpenChange={() => setViewingDocument(null)}
      >
        {viewingDocument && (
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{viewingDocument.filename}</DialogTitle>
              <DialogDescription>
                Document uploaded for {stepName}
              </DialogDescription>
            </DialogHeader>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">
                Document preview would be displayed here
              </p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

// ================== Document Upload Modal ==================
const DocumentUploadModal = ({
  step,
  employeeId,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 10 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPEG, PNG, or Word documents only.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("stepId", step.stepId.toString());
      formData.append("stepName", step.name);

      const response = await fetch(
        `http://localhost:5000/api/onboarding/${employeeId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });

      onUploadSuccess();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Document - {step.name}
        </DialogTitle>
        <DialogDescription>
          Upload required documents for this onboarding step. Supported formats:
          PDF, JPEG, PNG, Word documents (max 10MB)
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="document-upload">Select Document</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Input
              id="document-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
            />
            <Label htmlFor="document-upload" className="cursor-pointer">
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile ? selectedFile.name : "Click to select file"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPEG, PNG, Word documents up to 10MB
                  </p>
                </div>
              </div>
            </Label>
          </div>
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedFile.name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// ================== Employee Select Component ==================
const EmployeeSelect = ({ employees, selectedEmployee, onEmployeeSelect }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (selectedEmployee) {
      setInputValue(
        `${selectedEmployee.name} (${selectedEmployee.employeeId})`
      );
    } else {
      setInputValue("");
    }
  }, [selectedEmployee]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (!value.trim()) {
      onEmployeeSelect(null);
      return;
    }

    const foundEmployee = employees.find((emp) => {
      const displayValue = `${emp.name} (${emp.employeeId})`;
      return (
        displayValue === value ||
        emp.name.toLowerCase().includes(value.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(value.toLowerCase())
      );
    });

    if (foundEmployee) {
      onEmployeeSelect(foundEmployee);
    } else {
      onEmployeeSelect(null);
    }
  };

  const handleInputBlur = (e) => {
    const value = e.target.value;
    if (value && !selectedEmployee) {
      const foundEmployee = employees.find((emp) => {
        const displayValue = `${emp.name} (${emp.employeeId})`;
        return displayValue === value;
      });

      if (foundEmployee) {
        onEmployeeSelect(foundEmployee);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee-select" className="text-sm font-medium">
          Select Employee *
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            list="employees-list"
            id="employee-select"
            placeholder="Type employee name or ID, or select from dropdown..."
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="pl-10 w-full"
          />
          <datalist id="employees-list">
            {employees.map((employee) => (
              <option
                key={employee.employeeId}
                value={`${employee.name} (${employee.employeeId})`}
              >
                {employee.department} - {employee.designation}
              </option>
            ))}
          </datalist>
        </div>
        <p className="text-xs text-muted-foreground">
          Start typing to search or click the dropdown to select an employee
        </p>
      </div>

      {selectedEmployee && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Selected Employee
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">Name:</span>
              <span className="text-gray-900">{selectedEmployee.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">ID:</span>
              <span className="text-gray-900">
                {selectedEmployee.employeeId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">
                Department:
              </span>
              <span className="text-gray-900">
                {selectedEmployee.department}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">
                Position:
              </span>
              <span className="text-gray-900">
                {selectedEmployee.designation}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">Email:</span>
              <span className="text-gray-900">{selectedEmployee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">
                Location:
              </span>
              <span className="text-gray-900">{selectedEmployee.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium min-w-16">
                Status:
              </span>
              <Badge
                className={
                  selectedEmployee.status === "active"
                    ? "bg-green-100 text-green-800"
                    : selectedEmployee.status === "on-probation"
                    ? "bg-yellow-100 text-yellow-800"
                    : selectedEmployee.status === "on-leave"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {selectedEmployee.status.replace("-", " ")}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== Onboarding Form ==================
const OnboardingForm = ({ onSave, onCancel }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    startDate: "",
    assignedTo: "HR Manager",
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee to start onboarding",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    const onboardingData = {
      employeeId: selectedEmployee.employeeId,
      startDate: formData.startDate,
      assignedTo: formData.assignedTo,
    };

    setSubmitLoading(true);
    await onSave(onboardingData);
    setSubmitLoading(false);
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, startDate: today }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-4 block">
          Select Employee for Onboarding
        </Label>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span>Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-gray-50">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No employees found
            </h3>
            <p className="text-gray-500 mb-4">
              Please add employees first before starting onboarding
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open("/employees", "_blank")}
            >
              Go to Employees
            </Button>
          </div>
        ) : (
          <EmployeeSelect
            employees={employees}
            selectedEmployee={selectedEmployee}
            onEmployeeSelect={handleEmployeeSelect}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium">
            Start Date *
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo" className="text-sm font-medium">
            Assigned To
          </Label>
          <Select
            value={formData.assignedTo}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, assignedTo: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HR Manager">HR Manager</SelectItem>
              <SelectItem value="Department Head">Department Head</SelectItem>
              <SelectItem value="Team Lead">Team Lead</SelectItem>
              <SelectItem value="IT Department">IT Department</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!selectedEmployee || !formData.startDate || submitLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {submitLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Starting Onboarding...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Start Onboarding Process
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

// ================== Step Completion Component ==================
const StepCompletionSection = ({ candidate, onStepUpdate }) => {
  const [completingStep, setCompletingStep] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [selectedStepForDocs, setSelectedStepForDocs] = useState(null);

  const handleCompleteStep = async (step) => {
    try {
      setCompletingStep(step.stepId);

      const res = await fetch(
        `http://localhost:5000/api/onboarding/${candidate.employeeId}/step`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepId: step.stepId,
            notes: completionNotes,
          }),
        }
      );

      if (res.ok) {
        const updatedOnboarding = await res.json();
        onStepUpdate(updatedOnboarding);
        setCompletionNotes("");
        toast({
          title: "Step Completed!",
          description: `${step.name} has been marked as completed.`,
        });
      } else {
        throw new Error("Failed to complete step");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCompletingStep(null);
    }
  };

  const handleDeleteDocument = async (stepId, documentId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/onboarding/${candidate.employeeId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Delete failed");

      toast({
        title: "Document Deleted",
        description: "Document has been deleted successfully.",
      });

      // Refresh the onboarding data
      const onboardingResponse = await fetch(
        `http://localhost:5000/api/onboarding/${candidate.employeeId}`
      );
      if (onboardingResponse.ok) {
        const updatedOnboarding = await onboardingResponse.json();
        onStepUpdate(updatedOnboarding);
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStepStatus = (step) => {
    if (step.completed) return "completed";
    const currentStep = candidate.steps.find((s) => !s.completed);
    if (step.stepId === currentStep?.stepId) return "current";
    return "pending";
  };

  const getStepIcon = (stepName) => {
    switch (stepName) {
      case "Offer Letter":
        return FileText;
      case "Document Collection":
        return FileText;
      case "Background Check":
        return Shield;
      case "Policy Acknowledgment":
        return FileText;
      case "Equipment Request":
        return Briefcase;
      case "Profile Setup":
        return User;
      case "Manager Assignment":
        return User;
      case "Final Activation":
        return CheckCircle;
      default:
        return FileText;
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-0">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        Onboarding Steps & Documents
      </h3>

      <div className="space-y-6">
        {candidate.steps
          .sort((a, b) => a.stepId - b.stepId)
          .map((step, index) => {
            const status = getStepStatus(step);
            const StepIcon = getStepIcon(step.name);
            const documents = step.documents || [];

            return (
              <motion.div
                key={step.stepId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all ${
                  status === "completed"
                    ? "bg-green-50 border-green-200"
                    : status === "current"
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          status === "completed"
                            ? "bg-green-100 text-green-600"
                            : status === "current"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {status === "completed" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-medium ${
                              status === "completed"
                                ? "text-green-800"
                                : "text-gray-900"
                            }`}
                          >
                            {step.name}
                          </p>
                          {status === "current" && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 text-xs"
                            >
                              Current
                            </Badge>
                          )}
                          {documents.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-white"
                            >
                              {documents.length} doc
                              {documents.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {step.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {step.assignedTo}
                          </span>
                          {step.completed && step.completedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(step.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {status === "current" && (
                        <>
                          <Textarea
                            placeholder="Add completion notes..."
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            className="w-48 text-sm"
                            rows={2}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCompleteStep(step)}
                            disabled={completingStep === step.stepId}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {completingStep === step.stepId ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Complete
                          </Button>
                        </>
                      )}

                      {status === "pending" && (
                        <Badge variant="outline" className="text-gray-500">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  {(documents.length > 0 || status === "current") && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700">
                          Documents for this step
                        </Label>
                        {status === "current" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedStepForDocs(step)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                          </Button>
                        )}
                      </div>
                      <DocumentViewer
                        documents={documents}
                        stepName={step.name}
                        onDeleteDocument={(docId) =>
                          handleDeleteDocument(step.stepId, docId)
                        }
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Document Upload Modal */}
      <Dialog
        open={!!selectedStepForDocs}
        onOpenChange={() => setSelectedStepForDocs(null)}
      >
        {selectedStepForDocs && (
          <DocumentUploadModal
            step={selectedStepForDocs}
            employeeId={candidate.employeeId}
            onClose={() => setSelectedStepForDocs(null)}
            onUploadSuccess={() => {
              // Refresh data after upload
              fetch(
                `http://localhost:5000/api/onboarding/${candidate.employeeId}`
              )
                .then((res) => res.json())
                .then((updatedOnboarding) => onStepUpdate(updatedOnboarding));
            }}
          />
        )}
      </Dialog>
    </Card>
  );
};

// ================== Onboarding Details Modal ==================
const OnboardingDetailsModal = ({
  candidate,
  onClose,
  onUpdateStatus,
  onStepUpdate,
  onSendReminder,
}) => {
  const [newStatus, setNewStatus] = useState(candidate.status);
  const [notes, setNotes] = useState(candidate.notes || "");
  const [sendingReminder, setSendingReminder] = useState(false);

  const handleUpdate = () => {
    onUpdateStatus(candidate.employeeId, newStatus, notes);
  };

  // ✅ ENHANCED: Handle send reminder with dynamic message based on status
  const handleSendReminder = async () => {
    console.log(
      "🔔 [DEBUG] Sending reminder from details modal for:",
      candidate
    );

    try {
      setSendingReminder(true);

      // Determine message based on current status
      let message = "";
      let title = "";

      console.log("🔔 [DEBUG] Current candidate status:", candidate.status);

      switch (candidate.status) {
        case "in-progress":
          title = "Onboarding Process Started";
          message =
            "Your onboarding process has started. Please complete all the required steps to finish your onboarding.";
          break;
        case "completed":
          title = "Onboarding Completed!";
          message =
            "Congratulations! Your onboarding process has been completed successfully. Welcome to the team!";
          break;
        case "on-hold":
          title = "Onboarding On Hold";
          message =
            "Your onboarding process is currently on hold. Please contact HR for more information.";
          break;
        case "pending-activation":
          title = "Onboarding Pending Activation";
          message =
            "Your onboarding is pending activation. We'll notify you once it's activated.";
          break;
        default:
          title = "Onboarding Update";
          message =
            "Your onboarding process requires attention. Please check your onboarding dashboard.";
      }

      console.log("🔔 [DEBUG] Sending reminder with:", {
        employeeId: candidate.employeeId,
        employeeName: candidate.name,
        employeeEmail: candidate.email,
        currentStep: candidate.currentStep,
        status: candidate.status,
        title,
        message,
      });

      const reminderData = {
        employeeId: candidate.employeeId,
        employeeName: candidate.name,
        employeeEmail: candidate.email,
        currentStep: candidate.currentStep,
        status: candidate.status, // This is crucial for dynamic messages
        senderId: "admin",
        senderName: "HR Manager",
        title: title,
        message: message,
      };

      const response = await fetch(
        "http://localhost:5000/api/notifications/onboarding/reminder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reminderData),
        }
      );

      const result = await response.json();
      console.log("🔔 [DEBUG] Reminder API response:", result);

      if (response.ok) {
        console.log("✅ [DEBUG] Reminder sent successfully");
        toast({
          title: "Reminder Sent",
          description: `A reminder has been sent to ${candidate.name} about their onboarding status.`,
        });
      } else {
        console.error("❌ [DEBUG] Failed to send reminder:", result);
        throw new Error(result.message || "Failed to send reminder");
      }
    } catch (error) {
      console.error("❌ [DEBUG] Error sending reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder notification.",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending-activation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "on-hold":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <User className="w-5 h-5" />
          Onboarding Details: {candidate.name}
        </DialogTitle>
        <DialogDescription>
          View and manage onboarding progress and documents for {candidate.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Basic Information */}
        <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Employee ID</Label>
              <p className="font-medium text-gray-900">
                {candidate.employeeId}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Position</Label>
              <p className="font-medium text-gray-900">{candidate.position}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Department</Label>
              <p className="font-medium text-gray-900">
                {candidate.department}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Start Date</Label>
              <p className="font-medium text-gray-900">
                {new Date(candidate.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Assigned To</Label>
              <p className="font-medium text-gray-900">
                {candidate.assignedTo}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Email</Label>
              <p className="font-medium text-gray-900">{candidate.email}</p>
            </div>
          </div>
        </Card>

        {/* Progress Section */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Progress Tracking
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  Overall Progress
                </Label>
                <span className="text-sm text-gray-500">
                  {candidate.completedSteps}/{candidate.totalSteps} steps
                  completed
                </span>
              </div>
              <Progress value={candidate.progress} className="h-3" />
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(candidate.progress)}% complete
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Current Step
              </Label>
              <p className="font-medium text-gray-900 mt-1">
                {candidate.currentStep}
              </p>
            </div>
          </div>
        </Card>

        {/* Step Completion Section with Documents */}
        <StepCompletionSection
          candidate={candidate}
          onStepUpdate={onStepUpdate}
        />

        {/* Status Update Section */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Status Management
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-update" className="text-sm font-medium">
                  Update Status
                </Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status-update" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="pending-activation">
                      Pending Activation
                    </SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-center">
                <Badge
                  className={`text-sm px-3 py-1 ${getStatusColor(
                    candidate.status
                  )}`}
                >
                  Current: {candidate.status.replace("-", " ")}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes & Comments
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add relevant notes, comments, or instructions..."
                rows={4}
              />
            </div>
          </div>
        </Card>
      </div>

      <DialogFooter className="flex justify-between">
        <Button
          onClick={handleSendReminder}
          disabled={sendingReminder}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {sendingReminder ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Send Reminder
            </>
          )}
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Status
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

// ================== Main Onboarding Section ==================
const OnboardingSection = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setModalOpen] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [onboardingCandidates, setOnboardingCandidates] = useState([]);
  const [completedOnboarding, setCompletedOnboarding] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOnboardings();
  }, []);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      console.log("🔄 [DEBUG] Fetching onboarding data...");
      const res = await fetch("http://localhost:5000/api/onboarding");
      if (res.ok) {
        const data = await res.json();
        console.log(
          "✅ [DEBUG] Onboarding data fetched:",
          data.length,
          "records"
        );
        setOnboardingCandidates(data.filter((c) => c.status !== "completed"));
        setCompletedOnboarding(data.filter((c) => c.status === "completed"));
      } else {
        console.error(
          "❌ [DEBUG] Failed to fetch onboarding data:",
          res.status
        );
      }
    } catch (err) {
      console.error("❌ [DEBUG] Error fetching onboarding data:", err);
      console.log("No onboarding data found, starting with empty state");
      setOnboardingCandidates([]);
      setCompletedOnboarding([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async (onboardingData) => {
    try {
      console.log("🔄 [DEBUG] Starting onboarding for:", onboardingData);
      const res = await fetch("http://localhost:5000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ [DEBUG] Failed to start onboarding:", errorData);
        throw new Error(errorData.error || "Failed to start onboarding");
      }

      const newOnboarding = await res.json();
      console.log("✅ [DEBUG] Onboarding started successfully:", newOnboarding);

      toast({
        title: "Onboarding Started",
        description: `Onboarding process has been initiated for ${newOnboarding.name}.`,
      });

      setModalOpen(false);
      fetchOnboardings();
    } catch (err) {
      console.error("❌ [DEBUG] Error starting onboarding:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ✅ ENHANCED: Send reminder notification to employee with dynamic message
  const handleSendReminder = async (candidate) => {
    console.log("🔔 [DEBUG] Sending reminder from main list for:", candidate);

    try {
      // For main list, always send the "process started" reminder
      const reminderData = {
        employeeId: candidate.employeeId,
        employeeName: candidate.name,
        employeeEmail: candidate.email,
        currentStep: candidate.currentStep,
        status: candidate.status,
        senderId: "admin",
        senderName: "HR Manager",
        title: "Onboarding Process Started",
        message:
          "Your onboarding process has started. Please complete all the required steps to finish your onboarding.",
      };

      console.log("🔔 [DEBUG] Sending main list reminder with:", reminderData);

      const response = await fetch(
        "http://localhost:5000/api/notifications/onboarding/reminder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reminderData),
        }
      );

      const result = await response.json();
      console.log("🔔 [DEBUG] Main list reminder API response:", result);

      if (response.ok) {
        console.log("✅ [DEBUG] Main list reminder sent successfully");
        toast({
          title: "Reminder Sent",
          description: `A reminder has been sent to ${candidate.name} to complete their onboarding steps.`,
        });
      } else {
        console.error("❌ [DEBUG] Failed to send main list reminder:", result);
        throw new Error(result.message || "Failed to send reminder");
      }
    } catch (error) {
      console.error("❌ [DEBUG] Error sending main list reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder notification.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (employeeId, newStatus, notes) => {
    try {
      console.log(
        "🔄 [DEBUG] Updating status for:",
        employeeId,
        "to:",
        newStatus
      );
      const res = await fetch(
        `http://localhost:5000/api/onboarding/${employeeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, notes }),
        }
      );

      if (res.ok) {
        console.log("✅ [DEBUG] Status updated successfully");
        toast({
          title: "Status Updated",
          description: `Status updated to ${newStatus.replace("-", " ")}`,
        });
        setViewingCandidate(null);
        fetchOnboardings();
      } else {
        console.error("❌ [DEBUG] Failed to update status:", res.status);
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error("❌ [DEBUG] Error updating status:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleStepUpdate = (updatedOnboarding) => {
    console.log("🔄 [DEBUG] Step updated:", updatedOnboarding);
    setOnboardingCandidates((prev) =>
      prev.map((candidate) =>
        candidate.employeeId === updatedOnboarding.employeeId
          ? updatedOnboarding
          : candidate
      )
    );

    if (updatedOnboarding.status === "completed") {
      console.log("✅ [DEBUG] Onboarding completed, moving to completed list");
      setOnboardingCandidates((prev) =>
        prev.filter((c) => c.employeeId !== updatedOnboarding.employeeId)
      );
      setCompletedOnboarding((prev) => [...prev, updatedOnboarding]);
    }

    if (
      viewingCandidate &&
      viewingCandidate.employeeId === updatedOnboarding.employeeId
    ) {
      setViewingCandidate(updatedOnboarding);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending-activation":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on-hold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "pending-activation":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "on-hold":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const onboardingSteps = [
    {
      id: 1,
      name: "Offer Letter",
      icon: FileText,
      description: "Send and receive signed offer letter",
    },
    {
      id: 2,
      name: "Document Collection",
      icon: FileText,
      description: "Collect required documents and KYC",
    },
    {
      id: 3,
      name: "Background Check",
      icon: Shield,
      description: "Verify employment and education history",
    },
    {
      id: 4,
      name: "Policy Acknowledgment",
      icon: FileText,
      description: "Review and acknowledge company policies",
    },
    {
      id: 5,
      name: "Equipment Request",
      icon: Briefcase,
      description: "Request and assign necessary equipment",
    },
    {
      id: 6,
      name: "Profile Setup",
      icon: User,
      description: "Complete employee profile and system access",
    },
    {
      id: 7,
      name: "Manager Assignment",
      icon: User,
      description: "Assign reporting manager and team",
    },
    {
      id: 8,
      name: "Final Activation",
      icon: CheckCircle,
      description: "Activate employee profile and access",
    },
  ];

  const renderActiveOnboarding = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading onboarding data...</span>
        </div>
      );
    }

    if (onboardingCandidates.length === 0) {
      return (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No active onboarding
          </h3>
          <p className="text-gray-500 mb-6">
            Start a new onboarding process for employees
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Onboarding
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {onboardingCandidates.map((candidate, index) => {
          const totalDocuments = candidate.steps.reduce(
            (total, step) =>
              total + (step.documents ? step.documents.length : 0),
            0
          );

          return (
            <motion.div
              key={candidate.employeeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 card-hover group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {candidate.position} • {candidate.department}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start Date:{" "}
                        {new Date(candidate.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {totalDocuments > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {totalDocuments} doc{totalDocuments !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge
                      className={`flex items-center gap-1 ${getStatusColor(
                        candidate.status
                      )}`}
                    >
                      {getStatusIcon(candidate.status)}
                      {candidate.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progress
                      </span>
                      <span className="text-sm text-gray-500">
                        {candidate.completedSteps}/{candidate.totalSteps} steps
                        completed
                      </span>
                    </div>
                    <Progress value={candidate.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Step</p>
                      <p className="text-sm font-medium text-gray-900">
                        {candidate.currentStep}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                      <p className="text-sm text-gray-900">
                        {candidate.assignedTo}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Documents</p>
                      <p className="text-sm text-gray-900">
                        {totalDocuments} uploaded
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setViewingCandidate(candidate)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details & Documents
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReminder(candidate)}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderOnboardingSteps = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {onboardingSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="p-6 card-hover group">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Step {step.id}
                    </span>
                    <h3 className="font-semibold text-gray-900">{step.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  const renderCompletedOnboarding = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading completed onboarding...</span>
        </div>
      );
    }

    if (completedOnboarding.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No completed onboarding
          </h3>
          <p className="text-gray-500">
            Completed onboarding processes will appear here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {completedOnboarding.map((candidate, index) => {
          const totalDocuments = candidate.steps.reduce(
            (total, step) =>
              total + (step.documents ? step.documents.length : 0),
            0
          );

          return (
            <motion.div
              key={candidate.employeeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {candidate.position} • {candidate.department}
                      </p>
                      {totalDocuments > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {totalDocuments} document
                          {totalDocuments !== 1 ? "s" : ""} uploaded
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Completed:{" "}
                      {new Date(
                        candidate.updatedAt || candidate.startDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      By: {candidate.assignedTo}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const tabs = [
    {
      id: "active",
      label: "Active Onboarding",
      icon: Clock,
      count: onboardingCandidates.length,
    },
    { id: "steps", label: "Onboarding Steps", icon: FileText },
    {
      id: "completed",
      label: "Completed",
      icon: CheckCircle,
      count: completedOnboarding.length,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Onboarding - HRMS Pro</title>
        <meta
          name="description"
          content="Streamline employee onboarding with automated workflows, document collection, and progress tracking in HRMS Pro"
        />
      </Helmet>

      {/* Start Onboarding Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="w-6 h-6" />
              Start New Onboarding
            </DialogTitle>
            <DialogDescription>
              Select an employee and fill in the details to begin the onboarding
              process
            </DialogDescription>
          </DialogHeader>
          <OnboardingForm
            onSave={handleStartOnboarding}
            onCancel={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View/Edit Onboarding Modal */}
      <Dialog
        open={!!viewingCandidate}
        onOpenChange={() => setViewingCandidate(null)}
      >
        {viewingCandidate && (
          <OnboardingDetailsModal
            candidate={viewingCandidate}
            onClose={() => setViewingCandidate(null)}
            onUpdateStatus={handleUpdateStatus}
            onStepUpdate={handleStepUpdate}
            onSendReminder={handleSendReminder}
          />
        )}
      </Dialog>

      <div className="space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Onboarding
            </h1>
            <p className="text-gray-600 mt-2">
              Streamline new hire onboarding with automated workflows, document
              tracking, and progress monitoring
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Onboarding
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {onboardingCandidates.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedOnboarding.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Activation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    onboardingCandidates.filter(
                      (c) => c.status === "pending-activation"
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {onboardingCandidates.reduce(
                    (total, candidate) =>
                      total +
                      candidate.steps.reduce(
                        (stepTotal, step) =>
                          stepTotal +
                          (step.documents ? step.documents.length : 0),
                        0
                      ),
                    0
                  )}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-gray-200 text-gray-700"
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "active" && renderActiveOnboarding()}
          {activeTab === "steps" && renderOnboardingSteps()}
          {activeTab === "completed" && renderCompletedOnboarding()}
        </motion.div>
      </div>
    </>
  );
};

export default OnboardingSection;
