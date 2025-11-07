import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';

// --- Mock Components ---
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

const Input = ({ type = 'text', value, onChange, placeholder, disabled, required, className = '', id, name }) => 
  <input type={type} id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required} className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${className}`} />;

const Badge = ({ children, variant = 'default', className = '' }) => {
  let baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  if (variant === 'outline') baseStyle += ' border border-gray-300 text-gray-600';
  if (variant === 'secondary') baseStyle += ' bg-gray-100 text-gray-800';
  if (variant === 'success') baseStyle += ' bg-green-100 text-green-800';
  if (variant === 'warning') baseStyle += ' bg-yellow-100 text-yellow-800';
  if (variant === 'info') baseStyle += ' bg-blue-100 text-blue-800';
  return <span className={`${baseStyle} ${className}`}>{children}</span>;
};

// Dialog/Modal Mocking
const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-xl shadow-2xl relative max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
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

// Mock toast and useAuth
const toast = ({ title, description, variant }) => console.log(`[Toast | ${variant}]: ${title} - ${description}`);
const AuthContext = React.createContext(); 
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: { role: 'employee', employeeId: 'EMP1001', name: 'John Doe' } };
  }
  return context;
}; 

import { 
  BookOpen, 
  Loader2, 
  Search, 
  Download,
  FileText,
  Eye,
  Users,
  UserCheck,
  Filter,
  Calendar,
  RefreshCw // Added Refresh icon
} from 'lucide-react';

// Policy View Modal Component for Employees
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
    // The backend uses the 'authQueryToken' middleware on this route
    const documentApiUrl = `${API_BASE}/api/policies/${policy._id}/document?token=${encodeURIComponent(token)}`;

    try {
      const response = await fetch(documentApiUrl, {});
      
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
      setDocumentError(true);
      toast({
        title: 'Preview Failed',
        description: 'Could not load document for preview. Please try downloading.',
        variant: 'destructive'
      });
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {policy?.title}
          </DialogTitle>
          <DialogDescription>
            {policy?.policyType} • {policy?.category}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Policy Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Policy Type</h4>
              <p className="text-sm">{policy?.policyType || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Category</h4>
              <p className="text-sm">{policy?.category || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Visibility</h4>
              <div className="flex items-center gap-2">
                {policy?.visibility === 'SELECTED' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Selected Employees Only</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm">All Employees</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Last Updated</h4>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                {formatDate(policy?.updatedAt)}
              </div>
            </div>
          </div>

          {policy?.content && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg">{policy.content}</p>
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
                  <div className="h-[400px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading document...</span>
                  </div>
                ) : isPdf && documentUrl && !documentError ? (
                  <div className="h-[400px]">
                    <iframe
                      src={documentUrl}
                      className="w-full h-full border-0"
                      title={`Policy Document: ${policy.title}`}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">{policy.document.originalName}</p>
                    <p className="text-sm text-gray-600 mb-4">
                      {policy.document.fileSize ? (policy.document.fileSize / 1024 / 1024).toFixed(2) : 'Unknown'} MB • 
                      {policy.document.fileType ? ` ${policy.document.fileType.toUpperCase()} Document` : ' Document'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {documentError 
                        ? 'Unable to preview document. Please download to view.' 
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

// Main PolicyEmployee Page Component
const PolicyEmployee = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [categories, setCategories] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  
  // State to trigger re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // Fetch policies visible to the current employee
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const response = await fetch('http://localhost:5000/api/policies', {
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('hrms_token') || sessionStorage.getItem('hrms_token') || 'mock-token';
      
      const response = await fetch('http://localhost:5000/api/policies/categories/list', {
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

  // --- FIX: Added refreshTrigger dependency to force re-fetch ---
  useEffect(() => {
    fetchPolicies();
    fetchCategories();
  }, [refreshTrigger]); // Now runs on mount AND when refreshTrigger changes

  // Function to manually refresh the list
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Refreshing Policies',
      description: 'Fetching the latest policy list...',
      variant: 'info'
    });
  };
  // --- END FIX ---

  // Extract unique policy types
  useEffect(() => {
    const types = [...new Set(policies.map(policy => policy.policyType).filter(Boolean))];
    setPolicyTypes(types);
  }, [policies]);

  // Filter policies based on search and filters
  useEffect(() => {
    let filtered = policies;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(policy => 
        policy.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.policyType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(policy => 
        policy.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply policy type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(policy => 
        policy.policyType?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    setFilteredPolicies(filtered);
  }, [policies, searchQuery, selectedCategory, selectedType]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVisibilityBadge = (policy) => {
    // If the policy is SELECTED, the backend already guaranteed the user is in the allowedEmployeeIds list
    if (policy.visibility === 'SELECTED') {
      return (
        <Badge variant="info" className="flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          For You
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        All Employees
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading policies...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Company Policies</h1>
            <p className="text-gray-600 mt-2">
              View and access company policies and documents assigned to you
            </p>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <UserCheck className="w-4 h-4" />
              <span>Employee ID: {user?.employeeId}</span>
            </div>
          </div>
          
          <div className="text-right flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="secondary" className="text-sm">
              {filteredPolicies.length} {filteredPolicies.length === 1 ? 'Policy' : 'Policies'} Available
            </Badge>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div>
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

              {/* Policy Type Filter */}
              <div>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Policy Types</option>
                    {policyTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
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
              <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No policies found</h3>
              <p className="text-gray-500 text-center mb-4">
                {searchQuery || selectedCategory !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No policies are currently available for you'
                }
              </p>
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
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-200 cursor-pointer">
                  <CardHeader 
                    className="pb-3 border-none cursor-pointer" 
                    onClick={() => handleViewPolicy(policy)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                          {policy.title}
                        </CardTitle>
                        {getVisibilityBadge(policy)}
                      </div>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{policy.policyType}</Badge>
                        <span className="text-sm text-gray-500">{policy.category}</span>
                      </CardDescription>
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
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
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

                    {/* Last Updated */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Updated: {formatDate(policy.updatedAt)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPolicy(policy)}
                        className="h-7 text-xs"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Policy View Modal */}
        <PolicyViewModal
          policy={viewingPolicy}
          isOpen={!!viewingPolicy}
          onClose={() => setViewingPolicy(null)}
        />
      </div>
    </div>
  );
};

export default PolicyEmployee;