import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';

// --- Mock Components for Single-File Environment ---

const Card = ({ children, className = '' }) => <div className={`bg-white shadow rounded-xl p-4 ${className}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`p-4 border-b ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
const CardDescription = ({ children, className = '' }) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;

const Button = ({ children, onClick, disabled, variant = 'default', size = 'md', className = '', type = 'button' }) => {
  let baseStyle = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center';
  if (variant === 'default') baseStyle += ' bg-blue-600 text-white hover:bg-blue-700';
  if (variant === 'outline') baseStyle += ' border border-gray-300 text-gray-700 bg-white hover:bg-gray-100';
  if (variant === 'destructive') baseStyle += ' bg-red-600 text-white hover:bg-red-700';
  if (variant === 'ghost') baseStyle += ' text-gray-600 hover:bg-gray-100';
  if (size === 'sm') baseStyle = baseStyle.replace('px-4 py-2', 'px-3 py-1 text-sm');
  if (size === 'lg') baseStyle = baseStyle.replace('px-4 py-2', 'px-6 py-3 text-lg');
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>{children}</button>;
};

const Input = ({ type = 'text', value, onChange, placeholder, disabled, required, className = '', id, name, onKeyPress, onBlur, accept }) => 
  <input type={type} id={id} name={name} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} disabled={disabled} required={required} accept={accept} onKeyPress={onKeyPress} className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${className}`} />;
const Label = ({ htmlFor, children, className = '' }) => <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>{children}</label>;
const Textarea = ({ value, onChange, placeholder, disabled, required, className = '', id, name, rows }) => 
  <textarea id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required} rows={rows} className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${className}`} />;
const Badge = ({ children, variant = 'default', className = '' }) => {
  let baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  if (variant === 'outline') baseStyle += ' border border-gray-300 text-gray-600';
  if (variant === 'secondary') baseStyle += ' bg-gray-100 text-gray-800';
  if (variant === 'success') baseStyle += ' bg-green-100 text-green-800';
  return <span className={`${baseStyle} ${className}`}>{children}</span>;
};

// Dialog/Modal Mocking
const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
const DialogContent = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;
const DialogHeader = ({ children }) => <div className="border-b pb-4 mb-4">{children}</div>;
const DialogTitle = ({ children }) => <h3 className="text-2xl font-bold">{children}</h3>;
const DialogFooter = ({ children }) => <div className="pt-4 border-t flex justify-end space-x-2">{children}</div>;
const DialogDescription = ({ children }) => <p className="text-sm text-gray-500">{children}</p>;

// AlertDialog Mocking
const AlertDialog = Dialog;
const AlertDialogContent = DialogContent;
const AlertDialogHeader = DialogHeader;
const AlertDialogTitle = DialogTitle;
const AlertDialogDescription = DialogDescription;
const AlertDialogFooter = DialogFooter;
const AlertDialogAction = ({ children, onClick, className }) => <Button onClick={onClick} className={className}>{children}</Button>;
const AlertDialogCancel = ({ children, onClick }) => <Button variant="outline" onClick={onClick}>{children}</Button>;

// Mock toast and useAuth
const toast = ({ title, description, variant }) => console.log(`[Toast | ${variant}]: ${title} - ${description}`);
const AuthContext = React.createContext({ user: { role: 'admin', employeeId: 'ADM001' } }); 
const useAuth = () => useContext(AuthContext); 

// Mock Context for Employees (Will be replaced with dynamic data)
const AppContext = React.createContext({
  employees: {
    getAll: () => []
  }
});
const useAppContext = () => useContext(AppContext);

import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Loader2, 
  Search, 
  Download,
  FileText,
  Eye,
  FileUp,
  X,
  Upload,
  Users,
  UserCheck,
  ChevronDown,
  Check,
  UserX,
  Filter
} from 'lucide-react';

// Enhanced EmployeeSelector Component with Dynamic Data
const EmployeeSelector = ({ initialIds, onIdsChange, loading }) => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialIds || []);
  const [selectedEmployeeMap, setSelectedEmployeeMap] = useState(new Map());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setAllEmployees(result.data);
      } else {
        throw new Error('Invalid employee data received');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      });
      setAllEmployees([]);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Sync back to parent when selectedIds change
  useEffect(() => {
    onIdsChange(selectedIds);
  }, [selectedIds, onIdsChange]);
  
  // Update map when selectedIds change
  useEffect(() => {
    const newMap = new Map();
    selectedIds.forEach(id => {
      const emp = allEmployees.find(e => e.employeeId === id);
      if (emp) {
        newMap.set(emp.employeeId, emp);
      }
    });
    setSelectedEmployeeMap(newMap);
  }, [selectedIds, allEmployees]);

  const handleAddEmployee = (employeeId) => {
    if (employeeId && !selectedIds.includes(employeeId)) {
      setSelectedIds(prev => [...prev, employeeId]);
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  };

  const handleRemoveEmployee = (idToRemove) => {
    setSelectedIds(prev => prev.filter(id => id !== idToRemove));
  };

  const handleSelectAll = () => {
    const allIds = allEmployees.map(emp => emp.employeeId);
    setSelectedIds(allIds);
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Filter employees based on search term
  const filteredEmployees = allEmployees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployees = selectedIds.length;
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-800">Select Employees</Label>
        <div className="flex gap-2">
          {allEmployees.length > 0 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={fetchLoading || loading}
                className="text-xs h-8"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={fetchLoading || loading || selectedIds.length === 0}
                className="text-xs h-8"
              >
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Custom Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={fetchLoading || loading}
          className="flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-left shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            {fetchLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading employees...</span>
              </>
            ) : (
              <span className="text-gray-700">
                {selectedIds.length > 0 
                  ? `${selectedIds.length} employee${selectedIds.length > 1 ? 's' : ''} selected`
                  : 'Select employees...'
                }
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {/* Search Input */}
            <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="p-1">
              {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <UserX className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No employees found</p>
                </div>
              ) : (
                filteredEmployees.map(emp => (
                  <div
                    key={emp.employeeId}
                    onClick={() => handleAddEmployee(emp.employeeId)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedIds.includes(emp.employeeId)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded border ${
                      selectedIds.includes(emp.employeeId)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedIds.includes(emp.employeeId) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {emp.employeeId}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{emp.email}</span>
                        {emp.designation && (
                          <>
                            <span>•</span>
                            <span>{emp.designation}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {totalEmployees > 0 ? (
            <>
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700">
                {totalEmployees} employee{totalEmployees > 1 ? 's' : ''} selected
              </span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">No employees selected</span>
            </>
          )}
        </div>
        
        {totalEmployees > 0 && (
          <span className="text-xs text-gray-500">
            {totalEmployees === allEmployees.length ? 'All employees' : `${totalEmployees}/${allEmployees.length}`}
          </span>
        )}
      </div>

      {/* Selected Employees Grid */}
      {selectedIds.length > 0 && (
        <div className="grid gap-3 max-h-64 overflow-y-auto p-1">
          {selectedIds.map(id => {
            const emp = selectedEmployeeMap.get(id);
            if (!emp) return null;
            
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {emp.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {emp.employeeId}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="truncate">{emp.email}</span>
                      {emp.designation && (
                        <>
                          <span>•</span>
                          <span className="truncate">{emp.designation}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEmployee(id)}
                  className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {selectedIds.length === 0 && !fetchLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <Users className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm font-medium">No employees selected</p>
          <p className="text-xs mt-1">Use the dropdown above to add employees</p>
        </div>
      )}
    </div>
  );
};

// PolicyForm Component
const PolicyForm = ({ policy, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState(policy || { 
    title: '', 
    policyType: '',
    category: '', 
    content: '', 
    tags: [],
    visibility: 'ALL',
    allowedEmployeeIds: []
  });
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [initialAllowedIds, setInitialAllowedIds] = useState([]);
  
  useEffect(() => {
    if (policy?._id) {
        setFormData(policy);
        setInitialAllowedIds(policy.allowedEmployeeIds || []);
    } else {
        setFormData({ 
          title: '', 
          policyType: '',
          category: '', 
          content: '', 
          tags: [],
          visibility: 'ALL',
          allowedEmployeeIds: []
        });
        setInitialAllowedIds([]);
    }
  }, [policy]);
  
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'visibility' && value === 'ALL') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        allowedEmployeeIds: []
      }));
      setInitialAllowedIds([]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAllowedIdsChange = (validatedIds) => {
    setFormData(prev => ({
      ...prev,
      allowedEmployeeIds: validatedIds
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const isAllowedType = allowedTypes.includes(selectedFile.type) || 
                           ['pdf', 'doc', 'docx'].includes(fileExtension);
      
      if (!isAllowedType) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload PDF or Word documents only.',
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: 'Please upload files smaller than 5MB.',
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      
      toast({
        title: 'File Selected',
        description: selectedFile.name + ' ready for upload.',
        variant: 'default'
      });
    } else {
      setFile(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    document.getElementById('document').value = '';
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const hasExistingDocument = policy?.document;
    if (!file && !hasExistingDocument) {
      toast({
        title: 'Document Required',
        description: 'Please upload a policy document.',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.visibility === 'SELECTED' && formData.allowedEmployeeIds.length === 0) {
      toast({
        title: 'Visibility Error',
        description: 'Selected visibility requires at least one valid Employee ID.',
        variant: 'destructive'
      });
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('policyType', formData.policyType);
    data.append('category', formData.category);
    data.append('content', formData.content || '');
    data.append('tags', JSON.stringify(formData.tags));
    data.append('visibility', formData.visibility);
    data.append('allowedEmployeeIds', formData.allowedEmployeeIds.join(', '));

    if (file) {
      data.append('document', file);
    } 

    onSave(data);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="w-4 h-4" />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (['doc', 'docx'].includes(extension)) return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4" />;
  };
  
  const hasDocument = policy?.document || file;
  const displayFileName = file ? file.name : (policy?.document?.originalName || '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Policy Name *</Label>
          <Input 
            id="title" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            required 
            disabled={loading}
            placeholder="Enter policy name"
            className="h-12"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input 
            id="category" 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            required 
            disabled={loading}
            placeholder="e.g., Employee Handbook"
            className="h-12"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="policyType">Policy Type *</Label>
          <select
            id="policyType"
            name="policyType"
            value={formData.policyType}
            onChange={handleChange}
            required
            disabled={loading}
            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Policy Type</option>
            <option value="HR">HR Policy</option>
            <option value="Security">Security Policy</option>
            <option value="Operations">Operations Policy</option>
            <option value="Compliance">Compliance Policy</option>
            <option value="IT">IT Policy</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="visibility">Policy Visibility *</Label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            required
            disabled={loading}
            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">ALL Employees</option>
            <option value="SELECTED">SELECTED Employees</option>
          </select>
        </div>
      </div>
      
      {formData.visibility === 'SELECTED' && (
        <EmployeeSelector 
          initialIds={initialAllowedIds}
          onIdsChange={handleAllowedIdsChange}
          loading={loading}
        />
      )}

      <div>
        <Label htmlFor="document">Policy Document *</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-colors hover:border-blue-400">
          <Input 
            id="document"
            type="file"
            name="document"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
          <Label htmlFor="document" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-3">
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {file ? file.name : (policy?._id && !file ? 'Select new document to replace' : 'Click to upload document')}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PDF or Word documents (Max 5MB)
                </p>
              </div>
            </div>
          </Label>
        </div>

        {hasDocument && (
          <div className="mt-4 flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-blue-50">
            <div className="flex items-center gap-3">
              {getFileIcon(displayFileName)}
              <div>
                <p className="text-sm font-medium text-gray-900">{displayFileName}</p>
                <p className="text-xs text-gray-600">
                  {file ? (file.size / 1024 / 1024).toFixed(2) : (policy?.document?.fileSize ? (policy.document.fileSize / 1024 / 1024).toFixed(2) : '0.00')} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="content">Policy Description</Label>
        <Textarea 
          id="content" 
          name="content" 
          value={formData.content} 
          onChange={handleChange} 
          rows={4} 
          disabled={loading}
          placeholder="Brief description of the policy..."
          className="resize-none"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2 mb-3">
          <Input 
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="h-10"
          />
          <Button type="button" onClick={handleAddTag} disabled={loading} className="h-10">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-red-500 transition-colors"
                disabled={loading}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="h-11">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading || (!policy?._id && !file) || (formData.visibility === 'SELECTED' && formData.allowedEmployeeIds.length === 0)}
          className="h-11 min-w-24"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {policy?._id ? 'Update' : 'Create'} Policy
        </Button>
      </DialogFooter>
    </form>
  );
};

// PolicyViewModal Component
const PolicyViewModal = ({ policy, isOpen, onClose }) => {
  const [documentError, setDocumentError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localDocumentUrl, setLocalDocumentUrl] = useState(null); 

  const getToken = () => {
    return localStorage.getItem('hrms_token') || 
           sessionStorage.getItem('hrms_token') || 
           'mock-token';
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return '';
    return fileName.split('.').pop().toLowerCase();
  };

  const isPdfFile = (fileName) => {
    return getFileExtension(fileName) === 'pdf';
  };
  
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 401 || response.status === 403) {
            throw new Error(`Auth/Permission Error: ${response.status}`);
        }
        return response;
      } catch (error) {
        if (i === maxRetries - 1 || error.message.includes('Auth/Permission Error')) throw error;
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchDocumentForView = async () => {
    if (!policy?._id || !policy.document) return;
    
    if (localDocumentUrl) {
      window.URL.revokeObjectURL(localDocumentUrl);
      setLocalDocumentUrl(null);
    }
    
    setDocumentError(false);
    setIsLoading(true);

    const token = getToken();
    if (!token) {
      setDocumentError(true);
      setIsLoading(false);
      return;
    }

    const API_BASE = 'http://localhost:5000';
    const documentApiUrl = `${API_BASE}/api/policies/${policy._id}/document?token=${encodeURIComponent(token)}`;

    try {
      const response = await fetchWithRetry(documentApiUrl, {});
      
      if (response.status === 403) {
        setDocumentError(true);
        setIsLoading(false);
        toast({
          title: 'Access Denied',
          description: 'You are not authorized to view this document.',
          variant: 'destructive'
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setLocalDocumentUrl(url);
      setDocumentError(false);

    } catch (error) {
      console.error('Error fetching document for view:', error);
      const isPermissionError = error.message.includes('Auth/Permission Error');
      
      setDocumentError(true);
      if (!isPermissionError) {
        toast({
          title: 'Preview Failed',
          description: 'Could not load document for preview. Please try downloading.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && policy?.document) {
      fetchDocumentForView();
    }
    
    return () => {
      if (localDocumentUrl) {
        window.URL.revokeObjectURL(localDocumentUrl);
      }
    };
  }, [isOpen, policy]);

  const handleDownload = async () => {
    if (policy?._id && policy.document) {
      try {
        const token = getToken();
        if (!token) {
          toast({
            title: 'Authentication Required',
            description: 'Please login to download documents',
            variant: 'destructive'
          });
          return;
        }
        
        const downloadUrl = `http://localhost:5000/api/policies/${policy._id}/document?token=${encodeURIComponent(token)}`;

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = policy.document.originalName || `policy-${policy._id}.${getFileExtension(policy.document.originalName) || 'pdf'}`; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: 'Download Started',
          description: 'Policy document is being downloaded',
          variant: 'default'
        });
        
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: 'Download Failed',
          description: 'Could not download the document. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const documentUrl = localDocumentUrl;
  const isPdf = isPdfFile(policy?.document?.originalName);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        if (localDocumentUrl) {
          window.URL.revokeObjectURL(localDocumentUrl);
          setLocalDocumentUrl(null);
        }
      }
    }}> 
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col"> 
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {policy?.title}
          </DialogTitle>
          <DialogDescription>
            {policy?.policyType} • {policy?.category}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto pr-2"> 
          {policy?.visibility === 'SELECTED' && (
             <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <UserCheck className="w-4 h-4" />
                <span>Visibility: Selected Employees Only</span>
             </div>
          )}
          {policy?.content && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{policy.content}</p>
            </div>
          )}

          {policy?.tags && policy.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {policy.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {policy?.document && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Document</h4>
                <Button onClick={handleDownload} size="sm" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="h-[500px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : isPdf && documentUrl && !documentError ? (
                  <div className="h-[500px]">
                    <iframe
                      src={documentUrl}
                      className="w-full h-full border-0"
                      title={`Policy Document: ${policy.title}`}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">{policy.document.originalName}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {policy.document.fileSize ? (policy.document.fileSize / 1024 / 1024).toFixed(2) : 'Unknown'} MB • 
                      {policy.document.fileType ? ` ${policy.document.fileType.toUpperCase()} Document` : ' Document'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {documentError 
                        ? 'Unable to preview document. An error occurred or you do not have permission to view it. Please try downloading.' 
                        : 'Preview not available for this file type. Please download to view.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main CompanyPolicyPage Component
const CompanyPolicyPage = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [deletePolicy, setDeletePolicy] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const isPolicyManager = user && ['admin', 'employer', 'hr'].includes(user.role);

  useEffect(() => {
    fetchPolicies();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, selectedCategory]);
  
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 401 || response.status === 403) {
            throw new Error(`Auth/Permission Error: ${response.status}`);
        }
        return response;
      } catch (error) {
        if (i === maxRetries - 1 || error.message.includes('Auth/Permission Error')) throw error;
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const response = await fetchWithRetry('http://localhost:5000/api/policies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPolicies(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load policies',
        variant: 'destructive'
      });
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const response = await fetchWithRetry('http://localhost:5000/api/policies/categories/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    if (searchQuery) {
      filtered = filtered.filter(policy => 
        policy.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.policyType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(policy => 
        policy.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setShowForm(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleSavePolicy = async (formData) => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const url = editingPolicy 
        ? `http://localhost:5000/api/policies/${editingPolicy._id}`
        : 'http://localhost:5000/api/policies';

      const method = editingPolicy ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save policy');
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: editingPolicy ? 'Policy updated successfully' : 'Policy created successfully',
          variant: 'default'
        });
        
        setShowForm(false);
        setEditingPolicy(null);
        fetchPolicies();
      } else {
        throw new Error(result.message || 'Failed to save policy');
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save policy',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!deletePolicy) return;

    try {
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const response = await fetchWithRetry(`http://localhost:5000/api/policies/${deletePolicy._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete policy');
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Policy deleted successfully',
          variant: 'default'
        });
        
        setDeletePolicy(null);
        fetchPolicies();
      } else {
        throw new Error(result.message || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete policy',
        variant: 'destructive'
      });
    }
  };

  const handleViewPolicy = (policy) => {
    setViewingPolicy(policy);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="w-4 h-4" />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (['doc', 'docx'].includes(extension)) return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Company Policies</h1>
            <p className="text-muted-foreground">
              Manage and view company policies and documents
            </p>
          </div>
          
          {isPolicyManager && (
            <Button onClick={handleCreatePolicy} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Policy
            </Button>
          )}
        </div>

        {/* Search and Filter Section */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search policies by title, content, category, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies Grid */}
        {filteredPolicies.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No policies found</h3>
              <p className="text-gray-500 text-center mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No policies have been added yet'
                }
              </p>
              {isPolicyManager && !searchQuery && selectedCategory === 'all' && (
                <Button onClick={handleCreatePolicy}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Policy
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((policy) => (
              <motion.div
                key={policy._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                  <CardHeader className="pb-3 border-none">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {policy.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{policy.policyType}</Badge>
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            {policy.visibility === 'SELECTED' ? (
                              <UserCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Users className="w-3 h-3 text-green-500" />
                            )}
                            {policy.category}
                          </span>
                        </CardDescription>
                      </div>
                      
                      {isPolicyManager && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPolicy(policy)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletePolicy(policy)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {policy.content && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {policy.content}
                      </p>
                    )}
                    
                    {policy.tags && policy.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {policy.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {policy.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{policy.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {policy.document && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {getFileIcon(policy.document.originalName)}
                          <span className="truncate max-w-[120px]">
                            {policy.document.originalName}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPolicy(policy)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {!policy.document && (
                      <div className="pt-2 border-t border-gray-200">
                        <Badge variant="outline" className="text-xs">
                          No Document
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Policy Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingPolicy(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
              </DialogTitle>
              <DialogDescription>
                {editingPolicy 
                  ? 'Update the policy information below' 
                  : 'Fill in the details to create a new company policy'
                }
              </DialogDescription>
            </DialogHeader>
            
            <PolicyForm
              policy={editingPolicy}
              onSave={handleSavePolicy}
              onCancel={() => {
                setShowForm(false);
                setEditingPolicy(null);
              }}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Policy View Modal */}
        <PolicyViewModal
          policy={viewingPolicy}
          isOpen={!!viewingPolicy}
          onClose={() => setViewingPolicy(null)}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePolicy} onOpenChange={(open) => !open && setDeletePolicy(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the policy "{deletePolicy?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePolicy}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CompanyPolicyPage;