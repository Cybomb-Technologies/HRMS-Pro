import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, Edit, Plus, Upload, Download, Eye, X, Filter, Search, Folder, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';

const LetterTemplates = () => {
  const { toast } = useToast();
  const location = useLocation();
  
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showViewTemplate, setShowViewTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
    file: null
  });

  const [editTemplate, setEditTemplate] = useState({
    name: "",
    description: "",
    category: "",
    file: null
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('hrms_token');
    if (!token) {
      console.error('❌ No token found');
      toast({
        title: 'Authentication Error',
        description: 'Please login again',
        variant: 'destructive',
      });
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  // Load all data from APIs
  useEffect(() => {
    loadAllData();
  }, []);

  // Handle preloaded template data from HRLetters page
  useEffect(() => {
    // Check if we're coming from the edit button with template data
    if (location.state?.editingTemplate) {
      const template = location.state.editingTemplate;
      handlePreloadTemplate(template);
    }

    // Also check localStorage as fallback
    const storedTemplate = localStorage.getItem('editingTemplate');
    if (storedTemplate) {
      const template = JSON.parse(storedTemplate);
      handlePreloadTemplate(template);
      // Clear the stored template
      localStorage.removeItem('editingTemplate');
    }
  }, [location]);

  const handlePreloadTemplate = (template) => {
    setSelectedTemplate(template);
    setEditTemplate({
      name: template.name,
      description: template.description || '',
      category: template.category?._id || template.category,
      file: null
    });
    setShowEditTemplate(true);
    setIsEditing(true);
    
    toast({
      title: 'Template Loaded',
      description: 'Template data loaded for editing. Make your changes and click "Update Template".',
    });
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) {
        return;
      }

      // Load templates
      const templatesResponse = await fetch('http://localhost:5000/api/letter-templates', {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        console.log('📋 Templates loaded:', templatesData.templates);
        setTemplates(templatesData.templates || []);
      } else {
        console.error('Failed to load templates:', templatesResponse.status);
      }

      // Load categories
      await loadCategories();

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load categories separately
  const loadCategories = async () => {
    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;
      
      const response = await fetch('http://localhost:5000/api/letter-templates/categories', {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData.categories || []);
      } else {
        console.error('Failed to load categories:', response.status);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle file selection for add
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('📁 Selected file:', file);
    
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 50MB',
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF, Word, Excel, or text file',
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }

      console.log('✅ File validated, setting state...');
      setNewTemplate(prev => ({
        ...prev,
        file: file
      }));
    } else {
      console.log('❌ No file selected');
    }
  };

  // Handle file selection for edit
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    console.log('📁 Selected file for edit:', file);
    
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 50MB',
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF, Word, Excel, or text file',
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }

      setEditTemplate(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  // Handle Add Template
  const handleAddTemplate = async () => {
    console.log('🔄 Starting handleAddTemplate...');
    
    // Validate required fields
    if (!newTemplate.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newTemplate.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    if (!newTemplate.file) {
      toast({
        title: 'Validation Error',
        description: 'Template file is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📦 Creating FormData...');
      const formData = new FormData();
      formData.append('name', newTemplate.name.trim());
      formData.append('description', newTemplate.description || '');
      formData.append('category', newTemplate.category);
      formData.append('file', newTemplate.file);

      console.log('🔐 Getting auth headers...');
      const headers = getAuthHeaders();
      console.log('📋 Headers:', headers);
      
      if (Object.keys(headers).length === 0) {
        throw new Error('Authentication failed');
      }

      // Don't include Content-Type for FormData - browser will set it automatically with boundary
      delete headers['Content-Type'];
      
      console.log('🚀 Sending request to API...');
      const response = await fetch('http://localhost:5000/api/letter-templates', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      console.log('📨 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || `Failed to create template: ${response.status}`);
      }

      const templateData = await response.json();
      console.log('✅ Template created successfully:', templateData);
      
      // Reset form and show success
      setNewTemplate({
        name: "",
        description: "",
        category: "",
        file: null
      });
      setShowAddTemplate(false);
      
      toast({
        title: 'Success',
        description: 'Letter template created successfully',
      });
      
      // Reload templates to get the latest data
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error creating template:', error);
      console.error('❌ Error stack:', error.stack);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    setCategoryLoading(true);

    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) {
        throw new Error('Authentication failed');
      }

      const response = await fetch('http://localhost:5000/api/letter-templates/categories', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }

      const categoryData = await response.json();
      
      // Reset form and show success
      setNewCategory({
        name: "",
        description: ""
      });
      setShowAddCategory(false);
      
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
      
      // Reload categories
      await loadCategories();
      
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCategoryLoading(false);
    }
  };

  // Handle Edit Template
  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;

    console.log('🔄 Starting handleEditTemplate...');

    // Validate required fields
    if (!editTemplate.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editTemplate.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    setIsEditing(true);

    try {
      console.log('📦 Creating FormData for edit...');
      const formData = new FormData();
      formData.append('name', editTemplate.name.trim());
      formData.append('description', editTemplate.description || '');
      formData.append('category', editTemplate.category);
      
      if (editTemplate.file) {
        formData.append('file', editTemplate.file);
      }

      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) {
        throw new Error('Authentication failed');
      }

      delete headers['Content-Type'];
      
      console.log('🚀 Sending update request...');
      const response = await fetch(`http://localhost:5000/api/letter-templates/${selectedTemplate._id}`, {
        method: 'PUT',
        headers: headers,
        body: formData,
      });

      console.log('📨 Update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Template updated successfully:', data);
        
        // Update the template in the local state
        setTemplates(prev => prev.map(template => 
          template._id === selectedTemplate._id ? data.template : template
        ));
        
        setShowEditTemplate(false);
        setSelectedTemplate(null);
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      const response = await fetch(`http://localhost:5000/api/letter-templates/${id}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(template => template._id !== id));
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        });
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      const response = await fetch(`http://localhost:5000/api/letter-templates/categories/${id}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setCategories(prev => prev.filter(category => category._id !== id));
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
        
        // If the deleted category was selected in filter, reset filter
        if (filterCategory === id) {
          setFilterCategory('');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // View Template Details
  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowViewTemplate(true);
  };

  // Edit Template - Open modal with current data
  const handleEditClick = (template) => {
    setSelectedTemplate(template);
    setEditTemplate({
      name: template.name,
      description: template.description || '',
      category: template.category?._id || template.category,
      file: null
    });
    setShowEditTemplate(true);
  };

  // Download file function
  const handleDownload = async (template) => {
    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again',
          variant: 'destructive',
        });
        return;
      }

      if (!template.file || !template.file.fileId || !template.file.fileName) {
        console.error('❌ Template file data missing:', template.file);
        toast({
          title: 'No File',
          description: 'No valid file attached to this template',
          variant: 'destructive',
        });
        return;
      }

      console.log('📥 Attempting to download file:', {
        templateId: template._id,
        fileId: template.file.fileId,
        fileName: template.file.fileName
      });

      const response = await fetch(`http://localhost:5000/api/letter-templates/${template._id}/download`, {
        headers: headers,
        method: 'GET',
      });

      console.log('📨 Download response status:', response.status);

      if (response.ok) {
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = template.file.fileName;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Download Started',
          description: `Downloading ${template.file.fileName}`,
        });
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to download file';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field, value) => {
    setNewTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditInputChange = (field, value) => {
    setEditTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryInputChange = (field, value) => {
    setNewCategory(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get category name function
  const getCategoryName = (category) => {
    // If category is already a populated object with name
    if (category && typeof category === 'object' && category.name) {
      return category.name;
    }
    
    // If category is just an ID string
    if (category && typeof category === 'string') {
      const categoryObj = categories.find(cat => cat._id === category);
      return categoryObj ? categoryObj.name : 'Unknown Category';
    }
    
    return 'Uncategorized';
  };

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="w-4 h-4" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter templates based on search and category filter
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || 
                           getCategoryName(template.category) === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 w-full max-w-full"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Letter Templates ({templates.length})
        </h2>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => setShowAddCategory(true)}
              className="flex-1 sm:flex-none"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            
            <Button 
              onClick={() => setShowAddTemplate(!showAddTemplate)}
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">Add New Category</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCategory(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => handleCategoryInputChange("name", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                  disabled={categoryLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => handleCategoryInputChange("description", e.target.value)}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category description..."
                  disabled={categoryLoading}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAddCategory(false)}
                disabled={categoryLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim() || categoryLoading}
              >
                {categoryLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 mr-1" />
                    Create Category
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Categories Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            Categories ({categories.length})
          </h3>
        </div>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No categories found</p>
            <p className="text-sm">Create your first category to organize templates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Templates: {templates.filter(t => 
                        getCategoryName(t.category) === category.name
                      ).length}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCategory(category._id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Template Dropdown */}
      {showAddTemplate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gray-50 rounded-lg border"
        >
          <h3 className="font-semibold mb-3">Add New Letter Template</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter template name"
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={newTemplate.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter template description..."
                disabled={isSubmitting}
              />
            </div>

            {/* File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Template File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                  disabled={isSubmitting}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {newTemplate.file ? newTemplate.file.name : 'Click to upload template file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Word, Excel, Text files (Max 50MB)
                  </p>
                </label>
              </div>
              {newTemplate.file && (
                <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="text-sm text-green-700 flex items-center gap-2">
                    {getFileIcon(newTemplate.file.name)}
                    {newTemplate.file.name}
                  </span>
                  <button
                    onClick={() => handleInputChange("file", null)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTemplate(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddTemplate}
              disabled={!newTemplate.name || !newTemplate.category || !newTemplate.file || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* View Template Modal */}
      {showViewTemplate && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">Template Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewTemplate(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900 font-medium">{selectedTemplate.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{getCategoryName(selectedTemplate.category)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedTemplate.description || 'No description'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-gray-900">{formatDate(selectedTemplate.createdAt)}</p>
                </div>
              </div>
              
              {selectedTemplate.file && selectedTemplate.file.fileName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template File</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                    {getFileIcon(selectedTemplate.file.fileName)}
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{selectedTemplate.file.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedTemplate.file.fileSize)} • 
                        {selectedTemplate.file.fileType || 'Unknown type'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedTemplate)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowViewTemplate(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewTemplate(false);
                  handleEditClick(selectedTemplate);
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Template
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditTemplate && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">Edit Template</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditTemplate(false);
                  setSelectedTemplate(null);
                  setIsEditing(false);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={editTemplate.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template name"
                    disabled={isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editTemplate.category}
                    onChange={(e) => handleEditInputChange("category", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isEditing}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editTemplate.description}
                    onChange={(e) => handleEditInputChange("description", e.target.value)}
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template description..."
                    disabled={isEditing}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update File (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                      type="file"
                      onChange={handleEditFileChange}
                      className="hidden"
                      id="edit-file-upload"
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      disabled={isEditing}
                    />
                    <label htmlFor="edit-file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {editTemplate.file ? editTemplate.file.name : 'Click to update file (optional)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, Word, Excel, Text files (Max 50MB)
                      </p>
                    </label>
                  </div>
                  {selectedTemplate.file && selectedTemplate.file.fileName && (
                    <div className="mt-2 text-xs text-gray-500">
                      Current file: {selectedTemplate.file.fileName} ({formatFileSize(selectedTemplate.file.fileSize)})
                    </div>
                  )}
                  {editTemplate.file && (
                    <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm text-green-700 flex items-center gap-2">
                        {getFileIcon(editTemplate.file.name)}
                        {editTemplate.file.name}
                      </span>
                      <button
                        onClick={() => handleEditInputChange("file", null)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isEditing}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditTemplate(false);
                    setSelectedTemplate(null);
                    setIsEditing(false);
                  }}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditTemplate}
                  disabled={!editTemplate.name || !editTemplate.category || isEditing}
                >
                  {isEditing ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-1" />
                      Update Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Templates Table */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No templates found</p>
          <p className="text-sm">
            {searchTerm || filterCategory ? 'Try adjusting your search or filter' : 'Create your first template to get started'}
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-700">
                <th className="p-3 border font-semibold whitespace-nowrap">Name</th>
                <th className="p-3 border font-semibold whitespace-nowrap">Category</th>
                <th className="p-3 border font-semibold whitespace-nowrap">Description</th>
                <th className="p-3 border font-semibold whitespace-nowrap">File</th>
                <th className="p-3 border font-semibold whitespace-nowrap">Created</th>
                <th className="p-3 border font-semibold text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr key={template._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900 align-top whitespace-nowrap">
                    {template.name}
                  </td>
                  <td className="p-3 align-top whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryName(template.category)}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600 align-top max-w-[200px]">
                    <div className="line-clamp-2 break-words">
                      {template.description || 'No description'}
                    </div>
                  </td>
                  <td className="p-3 align-top whitespace-nowrap">
                    {template.file && template.file.fileName ? (
                      <div className="flex items-center gap-2">
                        {getFileIcon(template.file.fileName)}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {template.file.fileName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(template.file.fileSize)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(template)}
                          className="shrink-0 ml-2"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No file</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-500 align-top whitespace-nowrap">
                    {formatDate(template.createdAt)}
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex gap-1 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewTemplate(template)}
                        className="h-8 px-2"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(template)}
                        className="h-8 px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(template._id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default LetterTemplates;