import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Upload
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PolicyForm = ({ policy, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState(policy || { 
    title: '', 
    policyType: '',
    category: '', 
    content: '', 
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
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
      
      // Check file size (5MB max)
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: 'Please upload files smaller than 5MB.',
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }
      
      // Store the file in state
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
    
    // Validation for new policy creation: file is required
    const hasExistingDocument = policy?.document;
    if (!file && !hasExistingDocument) {
      toast({
        title: 'Document Required',
        description: 'Please upload a policy document.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create FormData object
    const data = new FormData();
    data.append('title', formData.title);
    data.append('policyType', formData.policyType);
    data.append('category', formData.category);
    data.append('content', formData.content || '');
    data.append('tags', JSON.stringify(formData.tags));

    // Append the file if a new one is selected
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
      </div>
      
      <div>
        <Label htmlFor="policyType">Policy Type *</Label>
        <select
          id="policyType"
          name="policyType"
          value={formData.policyType}
          onChange={handleChange}
          required
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
        <Label htmlFor="category">Category *</Label>
        <Input 
          id="category" 
          name="category" 
          value={formData.category} 
          onChange={handleChange} 
          required 
          disabled={loading}
          placeholder="e.g., Employee Handbook, Code of Conduct"
        />
      </div>

      <div>
        <Label htmlFor="document">Policy Document *</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
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
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : (policy?._id && !file ? 'Select new document to replace' : 'Click to upload document')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF or Word documents (Max 5MB)
                </p>
              </div>
            </div>
          </Label>
        </div>

        {hasDocument && (
          <div className="mt-2 flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              {getFileIcon(displayFileName)}
              <div>
                <p className="text-sm font-medium">{displayFileName}</p>
                <p className="text-xs text-muted-foreground">
                  {file ? (file.size / 1024 / 1024).toFixed(2) : (policy.document?.fileSize ? (policy.document.fileSize / 1024 / 1024).toFixed(2) : '0.00')} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2 mb-2">
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
          />
          <Button type="button" onClick={handleAddTag} disabled={loading}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-red-500"
                disabled={loading}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || (!policy?._id && !file)}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {policy?._id ? 'Update' : 'Create'} Policy
        </Button>
      </DialogFooter>
    </form>
  );
};

const PolicyViewModal = ({ policy, isOpen, onClose }) => {
  const [documentError, setDocumentError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // NEW STATE: Store the local object URL for the PDF/Document blob
  const [localDocumentUrl, setLocalDocumentUrl] = useState(null); 

  const getToken = () => {
    return localStorage.getItem('hrms_token') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('hrms_token') ||
           sessionStorage.getItem('token');
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
    
    // Clear previous URL
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
      const response = await fetch(documentApiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      // Create a local blob URL for the iframe to use (avoids COEP/CORP issues)
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
    
    // Cleanup function to revoke the object URL when modal closes or policy changes
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
        
        // Use the same URL structure but without the CORS constraint from fetch API
        const downloadUrl = `http://localhost:5000/api/policies/${policy._id}/document?token=${encodeURIComponent(token)}`;

        // Trigger download using the URL directly
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        // The backend should set Content-Disposition: attachment for downloads
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


  const documentUrl = localDocumentUrl; // Use the local blob URL for viewing
  const isPdf = isPdfFile(policy?.document?.originalName);

  return (
    // FIX: Adjusted max-h-[] to better handle content scrolling
    <Dialog open={isOpen} onOpenChange={onClose}>
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
        
        {/* Added overflow-y-auto to the container to allow content scrolling */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-2"> 
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
                      // Using local blob URL
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
                        ? 'Unable to preview document. An error occurred during loading. Please download to view.' 
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

  const isAdminOrEmployer = user && ['admin', 'employer'].includes(user.role);

  useEffect(() => {
    fetchPolicies();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, selectedCategory]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token');
      
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

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token');
      
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

  const filterPolicies = () => {
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
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token');
      
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
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/policies/${deletePolicy._id}`, {
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
    <div className="container mx-auto py-6 space-y-6">
      <Helmet>
        <title>Company Policies | HRMS</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Policies</h1>
          <p className="text-muted-foreground">
            Manage and view company policies and documents
          </p>
        </div>
        
        {isAdminOrEmployer && (
          <Button onClick={handleCreatePolicy} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Policy
          </Button>
        )}
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
        </CardContent>
      </Card>

      {/* Policies Grid */}
      {filteredPolicies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No policies found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No policies have been added yet'
              }
            </p>
            {isAdminOrEmployer && !searchQuery && selectedCategory === 'all' && (
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
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {policy.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline">{policy.policyType}</Badge>
                        <span>{policy.category}</span>
                      </CardDescription>
                    </div>
                    
                    {isAdminOrEmployer && (
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
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {policy.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
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
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!policy.document && (
                    <div className="pt-2 border-t">
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyPolicyPage;