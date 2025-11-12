import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserMinus,
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
  DollarSign,
  Eye,
  RefreshCw,
  Settings,
  Edit,
  Loader2,
  Trash2,
  Package,
  Send,
  Search,
  Download,
  FileCheck,
  Upload,
  X
} from 'lucide-react';

// ================== Document Viewer Component ==================
const DocumentViewer = ({ documents, stepName, onDeleteDocument }) => {
  const [viewingDocument, setViewingDocument] = useState(null);

  const handleDownload = async (document) => {
    try {
      const response = await fetch(`http://localhost:5000${document.url}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = document.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: 'Download Started',
          description: `${document.filename} is being downloaded.`
        });
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download document.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (document) => {
    if (window.confirm(`Are you sure you want to delete ${document.filename}?`)) {
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
      <Label className="text-sm font-medium">Uploaded Documents ({documents.length})</Label>
      {documents.map((doc) => (
        <Card key={doc._id} className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.status || 'pending'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`http://localhost:5000${doc.url}`, '_blank')}
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
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        {viewingDocument && (
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{viewingDocument.filename}</DialogTitle>
              <DialogDescription>
                Document uploaded for {stepName}
              </DialogDescription>
            </DialogHeader>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Document preview would be displayed here</p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

// ================== Document Upload Modal ==================
const DocumentUploadModal = ({ step, employeeId, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload PDF, JPEG, PNG, or Word documents only.',
          variant: 'destructive'
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: 'Please upload files smaller than 10MB.',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('stepId', step.stepId.toString());
      formData.append('stepName', step.name);

      const response = await fetch(`http://localhost:5000/api/offboarding/${employeeId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully.',
      });

      onUploadSuccess();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive'
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
          Upload required documents for this offboarding step. Supported formats: PDF, JPEG, PNG, Word documents (max 10MB)
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
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPEG, PNG, Word documents up to 10MB
                  </p>
                </div>
              </div>
            </Label>
          </div>
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-900">{selectedFile.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
                className="text-red-600 hover:text-red-800"
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
          className="bg-red-600 hover:bg-red-700"
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
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (selectedEmployee) {
      setInputValue(`${selectedEmployee.name} (${selectedEmployee.employeeId})`);
    } else {
      setInputValue('');
    }
  }, [selectedEmployee]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (!value.trim()) {
      onEmployeeSelect(null);
      return;
    }

    const foundEmployee = employees.find(emp => {
      const displayValue = `${emp.name} (${emp.employeeId})`;
      return displayValue === value || 
             emp.name.toLowerCase().includes(value.toLowerCase()) ||
             emp.employeeId.toLowerCase().includes(value.toLowerCase());
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
      const foundEmployee = employees.find(emp => {
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
        <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Selected Employee
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">Name:</span>
              <span className="text-gray-900">{selectedEmployee.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">ID:</span>
              <span className="text-gray-900">{selectedEmployee.employeeId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">Department:</span>
              <span className="text-gray-900">{selectedEmployee.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">Position:</span>
              <span className="text-gray-900">{selectedEmployee.designation}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">Email:</span>
              <span className="text-gray-900">{selectedEmployee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">Location:</span>
              <span className="text-gray-900">{selectedEmployee.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-700 font-medium min-w-16">Status:</span>
              <Badge className={
                selectedEmployee.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedEmployee.status === 'on-notice' ? 'bg-yellow-100 text-yellow-800' :
                selectedEmployee.status === 'on-leave' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }>
                {selectedEmployee.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== Offboarding Form ==================
const OffboardingForm = ({ onSave, onCancel }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    lastWorkingDay: '',
    assignedTo: 'HR Manager',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch employees',
        variant: 'destructive'
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      toast({ 
        title: 'Error', 
        description: 'Please select an employee to start offboarding',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.reason || !formData.lastWorkingDay) {
      toast({ 
        title: 'Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    const offboardingData = {
      employeeId: selectedEmployee.employeeId,
      reason: formData.reason,
      lastWorkingDay: formData.lastWorkingDay,
      assignedTo: formData.assignedTo,
      notes: formData.notes
    };
    
    setSubmitLoading(true);
    await onSave(offboardingData);
    setSubmitLoading(false);
  };

  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      lastWorkingDay: defaultDate.toISOString().split('T')[0]
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-4 block">Select Employee for Offboarding</Label>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600 mr-2" />
            <span>Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-gray-50">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-4">Please add employees first before starting offboarding</p>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.open('/employees', '_blank')}
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
          <Label htmlFor="reason" className="text-sm font-medium">Reason for Leaving *</Label>
          <Select 
            onValueChange={(value) => handleSelectChange('reason', value)} 
            value={formData.reason}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resignation">Resignation</SelectItem>
              <SelectItem value="termination">Termination</SelectItem>
              <SelectItem value="retirement">Retirement</SelectItem>
              <SelectItem value="end-of-contract">End of Contract</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastWorkingDay" className="text-sm font-medium">Last Working Day *</Label>
          <Input 
            id="lastWorkingDay" 
            name="lastWorkingDay" 
            type="date" 
            value={formData.lastWorkingDay} 
            onChange={handleChange} 
            required 
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Selected: {formData.lastWorkingDay ? new Date(formData.lastWorkingDay).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'No date selected'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</Label>
          <Select 
            onValueChange={(value) => handleSelectChange('assignedTo', value)} 
            value={formData.assignedTo}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HR Manager">HR Manager</SelectItem>
              <SelectItem value="Department Head">Department Head</SelectItem>
              <SelectItem value="Team Lead">Team Lead</SelectItem>
              <SelectItem value="IT Department">IT Department</SelectItem>
              <SelectItem value="Payroll Department">Payroll Department</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Initial Notes</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange} 
          placeholder="Any initial notes about the offboarding..."
          rows={3}
        />
      </div>
      
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={!selectedEmployee || !formData.reason || !formData.lastWorkingDay || submitLoading}
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
        >
          {submitLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Starting Offboarding...
            </>
          ) : (
            <>
              <UserMinus className="w-4 h-4 mr-2" />
              Start Offboarding Process
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

// ================== Step Completion Component ==================
const StepCompletionSection = ({ employee, onStepUpdate }) => {
  const [completingStep, setCompletingStep] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedStepForDocs, setSelectedStepForDocs] = useState(null);

  const handleCompleteStep = async (step) => {
    try {
      setCompletingStep(step.stepId);
      
      const res = await fetch(`http://localhost:5000/api/offboarding/${employee.employeeId}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stepId: step.stepId, 
          notes: completionNotes 
        })
      });

      if (res.ok) {
        const updatedOffboarding = await res.json();
        onStepUpdate(updatedOffboarding);
        setCompletionNotes('');
        toast({
          title: 'Step Completed!',
          description: `${step.name} has been marked as completed.`
        });
      } else {
        throw new Error('Failed to complete step');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setCompletingStep(null);
    }
  };

  const handleDeleteDocument = async (stepId, documentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/offboarding/${employee.employeeId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');
      
      toast({
        title: 'Document Deleted',
        description: 'Document has been deleted successfully.',
      });

      // Refresh the offboarding data
      const offboardingResponse = await fetch(`http://localhost:5000/api/offboarding/${employee.employeeId}`);
      if (offboardingResponse.ok) {
        const updatedOffboarding = await offboardingResponse.json();
        onStepUpdate(updatedOffboarding);
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStepStatus = (step) => {
    if (step.completed) return 'completed';
    const currentStep = employee.steps.find(s => !s.completed);
    if (step.stepId === currentStep?.stepId) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepName) => {
    switch (stepName) {
      case 'Resignation/Termination': return FileText;
      case 'Asset Recovery': return Package;
      case 'Knowledge Handover': return User;
      case 'Final Timesheet': return Clock;
      case 'Leave Encashment': return Calendar;
      case 'F&F Calculation': return DollarSign;
      case 'Profile Deactivation': return Shield;
      default: return FileText;
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-0">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        Offboarding Steps & Documents
      </h3>
      
      <div className="space-y-6">
        {employee.steps?.sort((a, b) => a.stepId - b.stepId).map((step, index) => {
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
                status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : status === 'current'
                  ? 'bg-red-50 border-red-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="space-y-4">
                {/* Step Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed' 
                        ? 'bg-green-100 text-green-600' 
                        : status === 'current'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${
                          status === 'completed' ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {step.name}
                        </p>
                        {status === 'current' && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                            Current
                          </Badge>
                        )}
                        {documents.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-white">
                            {documents.length} doc{documents.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
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
                    {status === 'current' && (
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
                    
                    {status === 'pending' && (
                      <Badge variant="outline" className="text-gray-500">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                {(documents.length > 0 || status === 'current') && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Documents for this step
                      </Label>
                      {status === 'current' && (
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
                      onDeleteDocument={(docId) => handleDeleteDocument(step.stepId, docId)}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Document Upload Modal */}
      <Dialog open={!!selectedStepForDocs} onOpenChange={() => setSelectedStepForDocs(null)}>
        {selectedStepForDocs && (
          <DocumentUploadModal 
            step={selectedStepForDocs}
            employeeId={employee.employeeId}
            onClose={() => setSelectedStepForDocs(null)}
            onUploadSuccess={() => {
              // Refresh data after upload
              fetch(`http://localhost:5000/api/offboarding/${employee.employeeId}`)
                .then(res => res.json())
                .then(updatedOffboarding => onStepUpdate(updatedOffboarding));
            }}
          />
        )}
      </Dialog>
    </Card>
  );
};

// ================== Offboarding Details Modal (updated to remove internal status update and rely on StepCompletion and new Complete button) ==================
const OffboardingDetailsModal = ({ employee, onClose, onUpdateStatus, onStepUpdate, onCompleteOffboarding, handleGenerateFF }) => {
  // Keeping this state for display or future simple updates, though complex status change moved to admin actions
  const [newStatus, setNewStatus] = useState(employee.status); 
  const [notes, setNotes] = useState(employee.notes || '');

  // Removed direct handleUpdate for status from here; kept as a prop for future use if needed,
  // but logic suggests using the dedicated complete button or step completion.
  // const handleUpdate = () => {
  //   onUpdateStatus(employee.employeeId, newStatus, notes);
  // };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending-final': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <UserMinus className="w-5 h-5" />
          Offboarding Details: {employee.name}
        </DialogTitle>
        <DialogDescription>
          View and manage offboarding progress and documents for {employee.name}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        {/* Basic Information */}
        <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Employee ID</Label>
              <p className="font-medium text-gray-900">{employee.employeeId}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Position</Label>
              <p className="font-medium text-gray-900">{employee.position}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Department</Label>
              <p className="font-medium text-gray-900">{employee.department}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Last Working Day</Label>
              <p className="font-medium text-gray-900">
                {formatDate(employee.lastWorkingDay)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Assigned To</Label>
              <p className="font-medium text-gray-900">{employee.assignedTo}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Reason</Label>
              <p className="font-medium text-gray-900 capitalize">{employee.reason}</p>
            </div>
          </div>
        </Card>

        {/* Progress Section */}
        <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Progress Tracking</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Overall Progress</Label>
                <span className="text-sm text-gray-500">
                  {employee.completedSteps}/{employee.totalSteps} steps completed
                </span>
              </div>
              <Progress value={employee.progress} className="h-3" />
              <p className="text-xs text-gray-500 mt-1">{Math.round(employee.progress)}% complete</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Step</Label>
              <p className="font-medium text-gray-900 mt-1">{employee.currentStep}</p>
            </div>
          </div>
        </Card>

        {/* Step Completion Section with Documents */}
        <StepCompletionSection 
          employee={employee} 
          onStepUpdate={onStepUpdate}
        />

        {/* Status Update/Admin Actions Section (Modified) */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Admin Actions / Status Management</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-start">
                <Badge className={`text-sm px-3 py-1 ${getStatusColor(employee.status)}`}>
                  Current Status: {employee.status.replace('-', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-update" className="text-sm font-medium">
                  Update Status (Manual)
                </Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status-update" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="pending-final">Pending Final Settlement</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="flex items-end">
               
                  <Button 
                    onClick={() => onCompleteOffboarding(employee)}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Apply Status Update
                  </Button>
                
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

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t">
               <div className="flex items-center gap-3">
                 <Button variant="outline" onClick={() => handleGenerateFF(employee)}>
                   <DollarSign className="mr-2 w-4 h-4" />
                   Generate F&F
                 </Button>
               </div>
               
               {/* NEW: Complete Offboarding Button */}
               {/* <div className="flex items-center gap-3">
                 {employee.status !== 'completed' && (
                   <Button 
                     className="bg-green-600 hover:bg-green-700"
                     onClick={() => onCompleteOffboarding(employee)}
                     title="Complete offboarding and mark employee inactive"
                   >
                     <CheckCircle className="w-4 h-4 mr-2" />
                     Complete Offboarding (Mark Inactive)
                   </Button>
                 )}
               </div> */}
            </div>
          </div>
        </Card>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

// ================== Main Offboarding Section ==================
const OffboardingSection = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [isModalOpen, setModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [offboardingEmployees, setOffboardingEmployees] = useState([]);
  const [completedOffboarding, setCompletedOffboarding] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOffboardings();
  }, []);

  const fetchOffboardings = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/offboarding');
      if (res.ok) {
        const data = await res.json();
        setOffboardingEmployees(data.filter(c => c.status !== 'completed'));
        setCompletedOffboarding(data.filter(c => c.status === 'completed'));
      } else {
        setOffboardingEmployees([]);
        setCompletedOffboarding([]);
      }
    } catch (err) {
      console.log('No offboarding data found, starting with empty state');
      setOffboardingEmployees([]);
      setCompletedOffboarding([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOffboarding = async (offboardingData) => {
    try {
      const res = await fetch('http://localhost:5000/api/offboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offboardingData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start offboarding');
      }

      const newOffboarding = await res.json();
      
      toast({ 
        title: 'Offboarding Started', 
        description: `Offboarding process has been initiated for ${newOffboarding.name}.`
      });
      
      setModalOpen(false);
      fetchOffboardings();
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleSendReminder = (employee) => {
    toast({
      title: 'Reminder Sent',
      description: `A reminder has been sent to ${employee.name} for step: ${employee.currentStep}.`
    });
  };

  const handleUpdateStatus = async (employeeId, newStatus, notes) => {
    try {
      const res = await fetch(`http://localhost:5000/api/offboarding/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (res.ok) {
        toast({ 
          title: 'Status Updated', 
          description: `Status updated to ${newStatus.replace('-', ' ')}`
        });
        // We will fetch offboardings to update the lists, then update viewingEmployee
        await fetchOffboardings(); 
        
        // Refresh the currently viewing employee details if open
        const offRes = await fetch(`http://localhost:5000/api/offboarding/${employeeId}`);
        if (offRes.ok) {
          const offData = await offRes.json();
          setViewingEmployee(offData);
        } else {
           // If fetch fails, close modal if it was open
           if(viewingEmployee && viewingEmployee.employeeId === employeeId) setViewingEmployee(null);
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleStepUpdate = (updatedOffboarding) => {
    setOffboardingEmployees(prev => 
      prev.map(employee => 
        employee.employeeId === updatedOffboarding.employeeId 
          ? updatedOffboarding 
          : employee
      )
    );
    
    // Check if status changed to completed in step update
    if (updatedOffboarding.status === 'completed') {
      setOffboardingEmployees(prev => 
        prev.filter(c => c.employeeId !== updatedOffboarding.employeeId)
      );
      setCompletedOffboarding(prev => [...prev.filter(c => c.employeeId !== updatedOffboarding.employeeId), updatedOffboarding]);
    }
    
    if (viewingEmployee && viewingEmployee.employeeId === updatedOffboarding.employeeId) {
      setViewingEmployee(updatedOffboarding);
    }
  };

  const handleGenerateFF = async (employee) => {
    try {
      const res = await fetch(`http://localhost:5000/api/offboarding/${employee.employeeId}/settlement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementStatus: 'calculated' })
      });

      if (res.ok) {
        toast({ 
          title: 'F&F Generated', 
          description: `Full and Final settlement has been calculated for ${employee.name}.` 
        });
        fetchOffboardings();
      } else {
        throw new Error('Failed to generate F&F');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };
  
  // ================== NEW: Complete offboarding (calls server to finalize and mark employee inactive) ==================
  const handleCompleteOffboarding = async (employee) => {
    if (!employee || !employee.employeeId) {
      toast({ title: 'Error', description: 'Invalid employee', variant: 'destructive' });
      return;
    }

    const ok = window.confirm(`Are you sure you want to COMPLETE offboarding for ${employee.name}? This will mark the employee as inactive.`);
    if (!ok) return;

    try {
      toast({ title: 'Completing...', description: `Completing offboarding for ${employee.name}...` });

      const res = await fetch(`http://localhost:5000/api/offboarding/${employee.employeeId}/complete`, {
        method: 'PUT'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to complete offboarding');
      }

      toast({
        title: 'Offboarding Completed',
        description: `${employee.name} marked as inactive successfully.`
      });

      // Refresh lists and close detail modal if completed
      await fetchOffboardings();
      setViewingEmployee(null);

    } catch (err) {
      console.error('completeOffboarding error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to complete offboarding',
        variant: 'destructive'
      });
    }
  };
  // =================================================================================================================

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'bg-red-100 text-red-800';
      case 'pending-final': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'pending-final': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'on-hold': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const offboardingSteps = [
    { id: 1, name: 'Resignation/Termination', icon: FileText, description: 'Process resignation or termination notice' },
    { id: 2, name: 'Asset Recovery', icon: Package, description: 'Collect company assets and equipment' },
    { id: 3, name: 'Knowledge Handover', icon: User, description: 'Transfer responsibilities and knowledge' },
    { id: 4, name: 'Final Timesheet', icon: Clock, description: 'Submit and approve final timesheet' },
    { id: 5, name: 'Leave Encashment', icon: Calendar, description: 'Calculate unused leave encashment' },
    { id: 6, name: 'F&F Calculation', icon: DollarSign, description: 'Calculate full and final settlement' },
    { id: 7, name: 'Profile Deactivation', icon: Shield, description: 'Deactivate access and archive profile' }
  ];

  const renderActiveOffboarding = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mr-3" />
          <span className="text-gray-600">Loading offboarding data...</span>
        </div>
      );
    }

    if (offboardingEmployees.length === 0) {
      return (
        <div className="text-center py-12">
          <UserMinus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active offboarding</h3>
          <p className="text-gray-500 mb-6">Start a new offboarding process for employees</p>
          <Button 
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Offboarding
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {offboardingEmployees.map((employee, index) => {
          const totalDocuments = employee.steps?.reduce((total, step) => 
            total + (step.documents ? step.documents.length : 0), 0
          ) || 0;

          return (
            <motion.div 
              key={employee.employeeId} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 card-hover group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">{employee.position} • {employee.department}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last Working Day: {new Date(employee.lastWorkingDay).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {totalDocuments > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <FileText className="w-3 h-3 mr-1" />
                        {totalDocuments} doc{totalDocuments !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge className={`flex items-center gap-1 ${getStatusColor(employee.status)}`}>
                      {getStatusIcon(employee.status)}
                      {employee.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {employee.completedSteps}/{employee.totalSteps} steps completed
                      </span>
                    </div>
                    <Progress value={employee.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Step</p>
                      <p className="text-sm font-medium text-gray-900">{employee.currentStep}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                      <p className="text-sm text-gray-900">{employee.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Documents</p>
                      <p className="text-sm text-gray-900">{totalDocuments} uploaded</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button size="sm" onClick={() => setViewingEmployee(employee)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details & Documents
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendReminder(employee)}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reminder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateFF(employee)}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Generate F&F
                    </Button>
                     {/* NEW: Complete Offboarding Button */}
                    <Button
                       size="sm"
                       className="bg-green-600 hover:bg-green-700 ml-2"
                       onClick={() => handleCompleteOffboarding(employee)}
                       title="Complete offboarding and mark employee inactive"
                    >
                       <CheckCircle className="w-4 h-4 mr-2" />
                       Complete Offboarding
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

  const renderOffboardingSteps = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {offboardingSteps.map((step, index) => {
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
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">Step {step.id}</span>
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

  const renderCompletedOffboarding = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mr-3" />
          <span className="text-gray-600">Loading completed offboarding...</span>
        </div>
      );
    }

    if (completedOffboarding.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No completed offboarding</h3>
          <p className="text-gray-500">Completed offboarding processes will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {completedOffboarding.map((employee, index) => {
          const totalDocuments = employee.steps?.reduce((total, step) => 
            total + (step.documents ? step.documents.length : 0), 0
          ) || 0;

          return (
            <motion.div 
              key={employee.employeeId} 
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
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">{employee.position} • {employee.department}</p>
                      {totalDocuments > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} uploaded
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Completed: {new Date(employee.updatedAt || employee.lastWorkingDay).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">By: {employee.assignedTo}</p>
                    {employee.finalSettlement?.totalSettlement && (
                      <p className="text-xs font-medium text-green-600 mt-1">
                        Settlement: ${employee.finalSettlement.totalSettlement.toLocaleString()}
                      </p>
                    )}
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
    { id: 'active', label: 'Active Offboarding', icon: Clock, count: offboardingEmployees.length },
    { id: 'steps', label: 'Offboarding Steps', icon: FileText },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: completedOffboarding.length }
  ];

  return (
    <>
      <Helmet>
        <title>Offboarding - HRMS Pro</title>
        <meta name="description" content="Streamline employee offboarding with automated workflows, asset recovery, and final settlement calculations in HRMS Pro" />
      </Helmet>

      {/* Start Offboarding Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserMinus className="w-6 h-6" />
              Start New Offboarding
            </DialogTitle>
            <DialogDescription>
              Select an employee and fill in the details to begin the offboarding process
            </DialogDescription>
          </DialogHeader>
          <OffboardingForm 
            onSave={handleStartOffboarding} 
            onCancel={() => setModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* View/Edit Offboarding Modal */}
      <Dialog open={!!viewingEmployee} onOpenChange={() => setViewingEmployee(null)}>
        {viewingEmployee && (
          <OffboardingDetailsModal 
            employee={viewingEmployee} 
            onClose={() => setViewingEmployee(null)} 
            onUpdateStatus={handleUpdateStatus}
            onStepUpdate={handleStepUpdate}
            onCompleteOffboarding={handleCompleteOffboarding} // Pass the new handler
            handleGenerateFF={handleGenerateFF} // Pass existing handler
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
            <h1 className="text-3xl font-bold text-gray-900">Employee Offboarding</h1>
            <p className="text-gray-600 mt-2">Streamline employee exits with automated workflows, asset recovery, and final settlement tracking</p>
          </div>
          <Button 
            onClick={() => setModalOpen(true)} 
            className="mt-4 sm:mt-0 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Offboarding
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
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{offboardingEmployees.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{completedOffboarding.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Final</p>
                <p className="text-2xl font-bold text-gray-900">
                  {offboardingEmployees.filter(c => c.status === 'pending-final').length}
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
                  {offboardingEmployees.reduce((total, employee) => 
                    total + (employee.steps?.reduce((stepTotal, step) => 
                      stepTotal + (step.documents ? step.documents.length : 0), 0
                    ) || 0), 0
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
                        ? 'border-red-500 text-red-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700">
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
          {activeTab === 'active' && renderActiveOffboarding()}
          {activeTab === 'steps' && renderOffboardingSteps()}
          {activeTab === 'completed' && renderCompletedOffboarding()}
        </motion.div>
      </div>
    </>
  );
};

export default OffboardingSection;