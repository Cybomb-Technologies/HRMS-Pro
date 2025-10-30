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
import { Plus, Edit, Trash2, BookOpen, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PolicyForm = ({ policy, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState(policy || { 
    title: '', 
    category: '', 
    content: '', 
    tags: [] 
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Policy Title *</Label>
        <Input 
          id="title" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          disabled={loading}
          placeholder="Enter policy title"
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
          placeholder="e.g., HR, Security, Operations"
        />
      </div>
      <div>
        <Label htmlFor="content">Policy Content *</Label>
        <Textarea 
          id="content" 
          name="content" 
          value={formData.content} 
          onChange={handleChange} 
          required 
          rows={8} 
          disabled={loading}
          placeholder="Enter the full policy content..."
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
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {policy?._id ? 'Update' : 'Create'} Policy
        </Button>
      </DialogFooter>
    </form>
  );
};

const CompanyPolicyPage = () => {
  const { user, logout } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [deletingPolicy, setDeletingPolicy] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // API base URL
  const API_BASE = 'http://localhost:5000/api';

  // Enhanced getAuthHeaders with better error handling
  const getAuthHeaders = () => {
    try {
      // Try multiple token storage locations
      const token = localStorage.getItem('hrms_token') || 
                   localStorage.getItem('token') || 
                   sessionStorage.getItem('hrms_token') ||
                   sessionStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        toast({
          title: 'Authentication Required',
          description: 'Please login to access policies',
          variant: 'destructive'
        });
        logout();
        return {};
      }

      // Validate token format
      if (typeof token !== 'string' || token.length < 10) {
        console.error('Invalid token format');
        toast({
          title: 'Invalid Token',
          description: 'Please login again',
          variant: 'destructive'
        });
        logout();
        return {};
      }

      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      toast({
        title: 'Authentication Error',
        description: 'Please login again',
        variant: 'destructive'
      });
      logout();
      return {};
    }
  };

  // Enhanced API fetch function
  const apiFetch = async (url, options = {}) => {
    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Handle authentication errors
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Authentication failed:', errorData);
        
        toast({
          title: 'Session Expired',
          description: errorData.message || 'Please login again',
          variant: 'destructive'
        });
        logout();
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      if (error.message !== 'Authentication failed') {
        throw error;
      }
      throw error; // Re-throw authentication errors
    }
  };

  // Fetch all policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      console.log('Fetching policies...');
      
      const data = await apiFetch('/policies');
      
      if (data.success) {
        console.log(`Successfully fetched ${data.data?.length || 0} policies`);
        setPolicies(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      if (error.message !== 'Authentication failed') {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load policies',
          variant: 'destructive'
        });
      }
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/policies/categories/list');
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't show toast for category errors as it's non-critical
    }
  };

  // Search policies
  const searchPolicies = async (query) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/policies/search/${encodeURIComponent(query)}`);
      
      if (data.success) {
        setPolicies(data.data || []);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching policies:', error);
      if (error.message !== 'Authentication failed') {
        toast({
          title: 'Search Error',
          description: error.message || 'Failed to search policies',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new policy
  const createPolicy = async (policyData) => {
    return await apiFetch('/policies', {
      method: 'POST',
      body: JSON.stringify(policyData)
    });
  };

  // Update policy
  const updatePolicy = async (id, policyData) => {
    return await apiFetch(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData)
    });
  };

  // Delete policy
  const deletePolicy = async (id) => {
    return await apiFetch(`/policies/${id}`, {
      method: 'DELETE'
    });
  };

  // Load policies and categories on component mount
  useEffect(() => {
    fetchPolicies();
    fetchCategories();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        searchPolicies(searchQuery);
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else if (searchQuery === '') {
      // Only refetch if we're clearing search and not on initial load
      fetchPolicies();
    }
  }, [searchQuery]);

  // Handle category filter
  useEffect(() => {
    if (selectedCategory && policies.length > 0) {
      const filtered = policies.filter(policy => 
        policy.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      setPolicies(filtered);
    } else if (selectedCategory === '' && policies.length === 0) {
      // If category is cleared and no policies, refetch
      fetchPolicies();
    }
  }, [selectedCategory]);

  const handleAddNew = () => {
    setEditingPolicy({ title: '', category: '', content: '', tags: [] });
    setModalOpen(true);
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setModalOpen(true);
  };

  const handleDelete = (policy) => {
    setDeletingPolicy(policy);
  };

  const confirmDelete = async () => {
    if (deletingPolicy) {
      try {
        await deletePolicy(deletingPolicy._id);
        toast({ 
          title: 'Policy Deleted', 
          description: `The policy "${deletingPolicy.title}" has been deleted.`,
          variant: 'default'
        });
        setDeletingPolicy(null);
        fetchPolicies(); // Refresh the list
      } catch (error) {
        console.error('Error deleting policy:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete policy',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSave = async (policyData) => {
    try {
      setFormLoading(true);
      
      let result;
      if (policyData._id) {
        // Update existing policy
        result = await updatePolicy(policyData._id, policyData);
        toast({ 
          title: 'Policy Updated', 
          description: 'The policy has been successfully updated.',
          variant: 'default'
        });
      } else {
        // Create new policy
        result = await createPolicy(policyData);
        toast({ 
          title: 'Policy Created', 
          description: 'The new policy has been successfully created.',
          variant: 'default'
        });
      }
      
      setModalOpen(false);
      setEditingPolicy(null);
      fetchPolicies(); // Refresh the list
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    fetchPolicies();
  };

  // Check if user has permission to manage policies
  const canManagePolicies = user && ['admin', 'hr', 'employer'].includes(user.role);

  // Filter policies based on search and category (client-side as fallback)
  const filteredPolicies = policies.filter(policy => {
    if (!policy) return false;
    
    const matchesSearch = !searchQuery || 
      (policy.title && policy.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (policy.content && policy.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (policy.category && policy.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || 
      (policy.category && policy.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Helmet>
        <title>Company Policies - HRMS Pro</title>
        <meta name="description" content="View and manage all company policies." />
      </Helmet>

      <Dialog open={isModalOpen} onOpenChange={(open) => { 
        if (!open) { 
          setEditingPolicy(null); 
          setModalOpen(false); 
        } else { 
          setModalOpen(true); 
        } 
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy?._id ? 'Edit' : 'Create'} Company Policy</DialogTitle>
          </DialogHeader>
          <PolicyForm 
            policy={editingPolicy} 
            onSave={handleSave} 
            onCancel={() => { setModalOpen(false); setEditingPolicy(null); }} 
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPolicy} onOpenChange={() => setDeletingPolicy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the policy "{deletingPolicy?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold">Company Policies</h1>
            <p className="text-muted-foreground mt-2">Central repository for all official company policies.</p>
          </div>
          {canManagePolicies && (
            <Button 
              onClick={handleAddNew} 
              className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Add New Policy
            </Button>
          )}
        </motion.div>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Categories</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={handleResetFilters}
            disabled={!searchQuery && !selectedCategory}
          >
            Reset Filters
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading policies...</span>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No policies found</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery || selectedCategory
                ? 'No policies match your search criteria. Try adjusting your filters.'
                : canManagePolicies 
                  ? 'Create your first company policy to get started.' 
                  : 'No policies have been published yet.'
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <Button onClick={handleResetFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
            {canManagePolicies && !searchQuery && !selectedCategory && (
              <Button onClick={handleAddNew} className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> 
                Create First Policy
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy, index) => (
              <motion.div 
                key={policy._id || policy.id || index} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {policy.title || 'Untitled Policy'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {policy.category || 'Uncategorized'}
                        </CardDescription>
                      </div>
                      <BookOpen className="w-6 h-6 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-4 mb-4">
                      {policy.content || 'No content available.'}
                    </p>
                    {policy.tags && policy.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {policy.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
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
                    <div className="text-xs text-muted-foreground space-y-1">
                      {policy.createdBy && (
                        <p>Created by: {policy.createdBy.name || policy.createdBy.email}</p>
                      )}
                      {policy.updatedAt && (
                        <p>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </CardContent>
                  {canManagePolicies && (
                    <div className="p-4 border-t">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(policy)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" /> 
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-1"
                          onClick={() => handleDelete(policy)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyPolicyPage;