// emponboarding.jsx
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
  FileText,
  User,
  Shield,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Upload,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  FileCheck,
} from "lucide-react";

// Import authentication context
import { useAuth } from "@/contexts/AuthContext";

const DocumentUploadModal = ({ step, isOpen, onClose, onUpload, onDelete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Safe access to step properties
  const stepName = step?.name || "Unknown Step";
  const stepId = step?.stepId;
  const employeeId = step?.employeeId;
  const documents = step?.documents || [];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

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

    if (!stepId || !employeeId) {
      toast({
        title: "Error",
        description: "Step information is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Create form data with proper field names
      const formData = new FormData();
      formData.append("document", selectedFile); // This must match multer's field name
      formData.append("stepId", stepId.toString()); // Ensure it's a string
      formData.append("stepName", stepName);

      console.log("Uploading document with data:", {
        stepId,
        stepName,
        employeeId,
        fileName: selectedFile.name,
      });

      const response = await fetch(
        `http://localhost:5000/api/onboarding/${employeeId}/documents`,
        {
          method: "POST",
          body: formData, // Don't set Content-Type header, let browser set it with boundary
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });

      onUpload(stepId, result.document);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteDocument = async (documentId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/onboarding/${employeeId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Delete failed");

      toast({
        title: "Document Deleted",
        description: "Your document has been deleted successfully.",
      });

      onDelete(stepId, documentId);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Don't render if step is null
  if (!step) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Documents - {stepName}
          </DialogTitle>
          <DialogDescription>
            Upload required documents for this onboarding step. Supported
            formats: PDF, JPEG, PNG, Word documents (max 10MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
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
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select file"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPEG, PNG, Word documents up to 10MB
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </div>

          {/* Uploaded Documents Section */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <Label>Uploaded Documents</Label>
              {documents.map((doc) => (
                <Card key={doc._id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded:{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `http://localhost:5000${doc.url}`,
                            "_blank"
                          )
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(doc._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {documents.length === 0 && (
            <div className="text-center py-4">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No documents uploaded yet</p>
            </div>
          )}
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
                <Clock className="w-4 h-4 mr-2 animate-spin" />
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
    </Dialog>
  );
};

const OnboardingStepCard = ({ step, onUploadClick }) => {
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

  const Icon = getStepIcon(step.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`p-6 border-l-4 ${
          step.completed
            ? "border-l-green-500 bg-green-50"
            : "border-l-blue-500 bg-white"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div
              className={`p-3 rounded-full ${
                step.completed ? "bg-green-100" : "bg-blue-100"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${
                  step.completed ? "text-green-600" : "text-blue-600"
                }`}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3
                  className={`font-semibold ${
                    step.completed ? "text-green-800" : "text-gray-900"
                  }`}
                >
                  {step.name}
                </h3>
                <Badge variant={step.completed ? "default" : "secondary"}>
                  {step.completed ? "Completed" : "In Progress"}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3">{step.description}</p>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Assigned to: {step.assignedTo}</span>
                </span>
                {step.completed && step.completedAt && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Completed:{" "}
                      {new Date(step.completedAt).toLocaleDateString()}
                    </span>
                  </span>
                )}
              </div>

              {/* Documents Preview */}
              {step.documents && step.documents.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Uploaded Documents:
                  </p>
                  <div className="space-y-2">
                    {step.documents.slice(0, 2).map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span className="text-gray-600 truncate">
                          {doc.filename}
                        </span>
                        {/* <Badge variant="outline" className="text-xs">
                          {doc.status || 'Pending Review'}
                        </Badge> */}
                      </div>
                    ))}
                    {step.documents.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{step.documents.length - 2} more documents
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {!step.completed && (
              <Button
                size="sm"
                onClick={() => onUploadClick(step)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            )}

            {step.documents && step.documents.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUploadClick(step)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View ({step.documents.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const EmpOnboarding = () => {
  const [onboardingData, setOnboardingData] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get employee ID from authentication context
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Get employee ID with proper fallbacks
  const getEmployeeId = () => {
    if (!user) return null;

    // Try multiple possible fields for employee ID
    return (
      user.employeeId || user.empId || user.employeeID || user._id || user.id
    );
  };

  const employeeId = getEmployeeId();

  useEffect(() => {
    if (!authLoading && isAuthenticated && employeeId) {
      fetchOnboardingData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      toast({
        title: "Authentication Required",
        description: "Please log in to view your onboarding information.",
        variant: "destructive",
      });
    }
  }, [employeeId, isAuthenticated, authLoading]);

  const fetchOnboardingData = async () => {
    if (!employeeId) {
      console.error("No employee ID found");
      toast({
        title: "Error",
        description: "Unable to identify employee. Please contact HR.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching onboarding data for employee:", employeeId);

      const response = await fetch(
        `http://localhost:5000/api/onboarding/${employeeId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No onboarding record found for employee:", employeeId);
          setOnboardingData(null);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      console.log("Onboarding data fetched:", data);
      setOnboardingData(data);
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
      toast({
        title: "Error",
        description: "Failed to load your onboarding information.",
        variant: "destructive",
      });
      setOnboardingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (step) => {
    if (!step) {
      console.error("Step is undefined or null");
      return;
    }

    // Add employeeId to step for the modal
    const stepWithEmployeeId = {
      ...step,
      employeeId: employeeId,
    };

    setSelectedStep(stepWithEmployeeId);
    setUploadModalOpen(true);
  };

  const handleDocumentUpload = (stepId, document) => {
    setOnboardingData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        steps: prev.steps.map((step) =>
          step.stepId === stepId
            ? {
                ...step,
                documents: [...(step.documents || []), document],
              }
            : step
        ),
      };
    });
  };

  const handleDocumentDelete = (stepId, documentId) => {
    setOnboardingData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        steps: prev.steps.map((step) =>
          step.stepId === stepId
            ? {
                ...step,
                documents: (step.documents || []).filter(
                  (doc) => doc._id !== documentId
                ),
              }
            : step
        ),
      };
    });
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your onboarding information.
          </p>
          <Button
            onClick={() => (window.location.href = "/login")}
            variant="outline"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading your onboarding information...
          </p>
        </div>
      </div>
    );
  }

  // Show no onboarding data found
  if (!onboardingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Onboarding Found
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have any active onboarding process. Please contact HR if
            you believe this is an error.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Employee ID: {employeeId}</p>
            <p>Name: {user?.name || "Not available"}</p>
            <p>Email: {user?.email || "Not available"}</p>
          </div>
          <div className="mt-6 space-x-2">
            <Button onClick={fetchOnboardingData} variant="outline">
              Refresh
            </Button>
            <Button
              onClick={() => (window.location.href = "/support")}
              variant="default"
            >
              Contact HR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Onboarding - HRMS Pro</title>
      </Helmet>

      {selectedStep && (
        <DocumentUploadModal
          step={selectedStep}
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedStep(null);
          }}
          onUpload={handleDocumentUpload}
          onDelete={handleDocumentDelete}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Your Onboarding Journey
            </h1>
            <p className="text-gray-600">
              Complete the following steps to finish your onboarding process
            </p>
          </motion.div>

          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {onboardingData.name}
                  </h2>
                  <p className="text-gray-600">
                    {onboardingData.position} • {onboardingData.department}
                  </p>
                </div>
                <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-800">
                  Employee ID: {onboardingData.employeeId}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Overall Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {onboardingData.completedSteps}/
                      {onboardingData.totalSteps} steps completed
                    </span>
                  </div>
                  <Progress value={onboardingData.progress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(onboardingData.progress)}% complete
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <p className="font-medium">
                      {new Date(onboardingData.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Step:</span>
                    <p className="font-medium">{onboardingData.currentStep}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Onboarding Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Onboarding Steps
              </h3>
              <Badge variant="outline" className="capitalize">
                {onboardingData.status.replace("-", " ")}
              </Badge>
            </div>

            {onboardingData.steps
              .sort((a, b) => a.stepId - b.stepId)
              .map((step, index) => (
                <OnboardingStepCard
                  key={step.stepId}
                  step={step}
                  onUploadClick={handleUploadClick}
                />
              ))}
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Need Help?
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    If you encounter any issues during your onboarding process
                    or have questions about document requirements, please
                    contact HR at{" "}
                    <a href="mailto:hr@company.com" className="underline">
                      hr@company.com
                    </a>{" "}
                    or call extension 1234.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default EmpOnboarding;
