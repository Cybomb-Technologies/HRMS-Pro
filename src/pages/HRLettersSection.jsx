import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HRLetters = () => {
  // State management
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);

  const navigate = useNavigate();

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('hrms_token');
    if (!token) {
      showToast('Authentication Error: Please login again', 'error');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  // JWT token decode function
  const decodeJWT = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // Get current user role and permissions
  useEffect(() => {
    const initializeUserPermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.role) {
            setCurrentUserRole(decoded.role);
            await fetchUserPermissions(decoded.role);
          }
        }
      } catch (error) {
        console.error("Error initializing permissions:", error);
      }
    };
    initializeUserPermissions();
  }, []);

  const fetchUserPermissions = async (role) => {
    try {
      const res = await fetch('http://localhost:5000/api/settings/roles/roles');
      if (res.ok) {
        const data = await res.json();
        const userRoleData = data.data.find(r => r.name === role);
        if (userRoleData) {
          setUserPermissions(userRoleData.permissions);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  // Permission check function
  const hasPermission = (action) => {
    if (currentUserRole === 'admin') return true;
    const hrLettersPermission = userPermissions.find(p => p.module === 'HR-Letters');
    if (!hrLettersPermission) return false;

    const accessLevel = hrLettersPermission.accessLevel;
    switch (action) {
      case 'read':
        return ['read', 'read-self', 'custom', 'crud'].includes(accessLevel);
      case 'download_letter':
        return ['read', 'read-self', 'custom', 'crud'].includes(accessLevel);
      case 'edit_letter':
        return ['custom', 'crud'].includes(accessLevel);
      default:
        return false;
    }
  };

  // Load all data from APIs
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      // Load templates
      const templatesResponse = await fetch('http://localhost:5000/api/letter-templates', {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      // Load categories
      const categoriesResponse = await fetch('http://localhost:5000/api/letter-templates/categories', {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Get category name
  const getCategoryName = (category) => {
    if (category && typeof category === 'object' && category.name) {
      return category.name;
    }
    if (category && typeof category === 'string') {
      const categoryObj = categories.find(cat => cat._id === category);
      return categoryObj ? categoryObj.name : 'Unknown Category';
    }
    return 'Uncategorized';
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
      day: 'numeric'
    });
  };

  // Handle download template
  const handleDownloadTemplate = async (template) => {
    if (!hasPermission('download_letter')) {
      showToast("You don't have permission to download templates", 'error');
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      const response = await fetch(`http://localhost:5000/api/letter-templates/${template._id}/download`, {
        headers: headers,
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = template.file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Template downloaded successfully', 'success');
      } else {
        throw new Error('Failed to download template');
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download template', 'error');
    }
  };

  // Handle use template - redirect to OnlyOffice editor
  const handleUseTemplate = async (template) => {
    if (!hasPermission('edit_letter')) {
      showToast("You don't have permission to use templates", 'error');
      return;
    }

    try {
      showToast('Opening template in editor...', 'info');
      
      // Navigate to the editor page with the template ID
      navigate(`/editor/${template._id}`);
      
    } catch (error) {
      console.error('Error using template:', error);
      showToast('Failed to open template in editor', 'error');
    }
  };

  // Filter templates based on search and category filter
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || 
                           (template.category && 
                            (typeof template.category === 'object' ? template.category._id : template.category) === filterCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📕';
      case 'doc': case 'docx': return '📘';
      case 'xls': case 'xlsx': return '📗';
      case 'txt': return '📃';
      default: return '📄';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HR Letter Templates</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse, download, and use letter templates for HR communications
          </p>
        </div>

        {/* Templates Library Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-900">
                Template Library ({filteredTemplates.length})
              </h2>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">📄</div>
                <p>No templates found</p>
                <p className="text-sm">
                  {searchTerm || filterCategory ? 'Try adjusting your search or filter' : 'No templates available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div key={template._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{template.name}</h3>
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {getCategoryName(template.category)}
                        </span>
                      </div>
                      <span className="text-3xl ml-4">{getFileIcon(template.file?.fileName)}</span>
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span className="font-medium">{formatFileSize(template.file?.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">{formatDate(template.createdAt)}</span>
                      </div>
                      {template.file?.fileType && (
                        <div className="flex justify-between">
                          <span>File Type:</span>
                          <span className="font-medium">{template.file.fileType}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        disabled={!hasPermission('edit_letter')}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <span>✏️</span>
                        Use Template
                      </button>
                      
                      <button
                        onClick={() => handleDownloadTemplate(template)}
                        disabled={!hasPermission('download_letter')}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <span>↓</span>
                        Download Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {templates.filter(t => t.file && t.file.fileName).length}
            </div>
            <div className="text-sm text-gray-600">Files Available</div>
          </div>
        </div>

        {/* Show message if no read permission */}
        {!hasPermission('read') && (
          <div className="mt-8 bg-white shadow rounded-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to view Letter Templates. Please contact your administrator.
            </p>
            <div className="text-sm text-gray-500">
              Current Role: <span className="font-medium">{currentUserRole}</span>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
          'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <div className="flex items-center">
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLetters;