import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  Pin,
  MessageSquare,
  Share,
  Bookmark,
  Heart,
  Filter,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Archive,
  BarChart3,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API service functions
const announcementAPI = {
  getAll: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });
      
      console.log('Fetching announcements from:', `${API_BASE_URL}/announcements?${queryParams}`);
      
      const response = await fetch(`${API_BASE_URL}/announcements?${queryParams}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Please check if backend server is running.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch announcements' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Announcements fetched successfully:', data.announcements?.length || 0);
      return data;
    } catch (error) {
      console.error('API getAll error:', error);
      throw error;
    }
  },

  create: async (announcementData) => {
    try {
      console.log('Creating announcement:', announcementData);
      
      const response = await fetch(`${API_BASE_URL}/announcements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData)
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create announcement' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Announcement created successfully:', data.announcement?._id);
      return data;
    } catch (error) {
      console.error('API create error:', error);
      throw error;
    }
  },

  update: async (id, announcementData) => {
    try {
      console.log('Updating announcement:', id, announcementData);
      
      const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData)
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update announcement' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Announcement updated successfully');
      return data;
    } catch (error) {
      console.error('API update error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log('Deleting announcement:', id);
      
      const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
        method: 'DELETE'
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete announcement' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Announcement deleted successfully');
      return data;
    } catch (error) {
      console.error('API delete error:', error);
      throw error;
    }
  },

  togglePin: async (id) => {
    try {
      console.log('Toggling pin for announcement:', id);
      
      const response = await fetch(`${API_BASE_URL}/announcements/${id}/pin`, {
        method: 'PATCH'
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to toggle pin' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Pin toggled successfully:', data.isPinned);
      return data;
    } catch (error) {
      console.error('API togglePin error:', error);
      throw error;
    }
  },

  toggleLike: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/announcements/${id}/like`, {
        method: 'POST'
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to toggle like' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API toggleLike error:', error);
      throw error;
    }
  },

  addComment: async (id, comment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/announcements/${id}/comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add comment' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API addComment error:', error);
      throw error;
    }
  }
};

// ================== Announcement Form ==================
const AnnouncementForm = ({ announcement, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState(
    announcement || {
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      isPinned: false,
      status: 'published'
    }
  );

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: <Megaphone className="w-4 h-4" />,
      hr: <Users className="w-4 h-4" />,
      it: <BarChart3 className="w-4 h-4" />,
      finance: <TrendingUp className="w-4 h-4" />,
      events: <Calendar className="w-4 h-4" />,
      policy: <Info className="w-4 h-4" />,
      emergency: <AlertCircle className="w-4 h-4" />,
    };
    return icons[category] || <Megaphone className="w-4 h-4" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
            Announcement Title
            {errors.title && <span className="text-red-500 text-sm">({errors.title})</span>}
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a clear and descriptive title..."
            className={errors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}
            required
          />
        </div>

        <div>
          <Label htmlFor="content" className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
            Content
            {errors.content && <span className="text-red-500 text-sm">({errors.content})</span>}
          </Label>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your announcement content here. Be clear and concise..."
            rows={6}
            className={`resize-none focus:ring-blue-500 ${errors.content ? 'border-red-500' : ''}`}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger className="focus:ring-blue-500">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general" className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  General
                </SelectItem>
                <SelectItem value="hr" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  HR
                </SelectItem>
                <SelectItem value="it" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  IT
                </SelectItem>
                <SelectItem value="finance" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Finance
                </SelectItem>
                <SelectItem value="events" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Events
                </SelectItem>
                <SelectItem value="policy" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Policy
                </SelectItem>
                <SelectItem value="emergency" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Emergency
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleSelectChange('priority', value)}
            >
              <SelectTrigger className="focus:ring-blue-500">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low" className="flex items-center gap-2 text-green-600">
                  <Info className="w-4 h-4" />
                  Low
                </SelectItem>
                <SelectItem value="normal" className="flex items-center gap-2 text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  Normal
                </SelectItem>
                <SelectItem value="high" className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  High
                </SelectItem>
                <SelectItem value="urgent" className="flex items-center gap-2 text-red-600">
                  <TrendingUp className="w-4 h-4" />
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              id="isPinned"
              name="isPinned"
              checked={formData.isPinned}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isPinned" className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-700">
              <Pin className="w-4 h-4" />
              Pin this announcement to the top
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="focus:ring-blue-500">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft" className="flex items-center gap-2 text-gray-600">
                  <EyeOff className="w-4 h-4" />
                  Draft
                </SelectItem>
                <SelectItem value="published" className="flex items-center gap-2 text-green-600">
                  <Eye className="w-4 h-4" />
                  Published
                </SelectItem>
                <SelectItem value="archived" className="flex items-center gap-2 text-orange-600">
                  <Archive className="w-4 h-4" />
                  Archived
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="px-6">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {announcement ? 'Update Announcement' : 'Post Announcement'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// ================== Announcement Card Component ==================
const AnnouncementCard = ({ 
  announcement, 
  onEdit, 
  onDelete, 
  onTogglePin,
  onLike,
  onComment,
  onView
}) => {
  const [isLiked, setIsLiked] = useState(announcement.likedBy?.includes('current-user') || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [localLikes, setLocalLikes] = useState(announcement.likes || 0);
  const [liking, setLiking] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800 border-gray-200',
      hr: 'bg-blue-50 text-blue-700 border-blue-200',
      it: 'bg-purple-50 text-purple-700 border-purple-200',
      finance: 'bg-green-50 text-green-700 border-green-200',
      events: 'bg-pink-50 text-pink-700 border-pink-200',
      policy: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      emergency: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[category] || colors.general;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'low': return <Info className="w-3 h-3" />;
      case 'normal': return <CheckCircle className="w-3 h-3" />;
      case 'high': return <AlertCircle className="w-3 h-3" />;
      case 'urgent': return <TrendingUp className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <EyeOff className="w-3 h-3" />;
      case 'published': return <Eye className="w-3 h-3" />;
      case 'archived': return <Archive className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    if (liking) return;
    
    setLiking(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLocalLikes(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      await onLike?.(announcement._id, newLikedState);
    } catch (error) {
      setIsLiked(!newLikedState);
      setLocalLikes(prev => newLikedState ? prev - 1 : prev + 1);
    } finally {
      setLiking(false);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: announcement.title,
        text: announcement.content.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${announcement.title}\n\n${announcement.content.substring(0, 200)}...`);
      // You can add a toast notification here
    }
  };

  const handleView = () => {
    onView?.(announcement);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className={`p-6 hover:shadow-lg transition-all duration-300 border-l-4 ${
        announcement.isPinned ? 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white' : 
        announcement.status === 'draft' ? 'border-l-gray-400 bg-gray-50/50' : 
        'border-l-transparent'
      } ${announcement.priority === 'urgent' ? 'ring-2 ring-red-200' : ''}`}>
        
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
              {announcement.author?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-semibold text-foreground flex items-center gap-2">
                {announcement.author || 'Admin'}
                {announcement.isPinned && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border-blue-200">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </Badge>
                )}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(announcement.createdAt)}</span>
                {announcement.status !== 'published' && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    {getStatusIcon(announcement.status)}
                    {announcement.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleView} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePin(announcement)} className="cursor-pointer">
                  <Pin className="mr-2 h-4 w-4" />
                  {announcement.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(announcement)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" /> 
                  Edit
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" /> 
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{announcement.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(announcement._id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Content Section */}
        <div className="mb-4">
          <h3 
            className="text-xl font-bold text-foreground mb-3 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={handleView}
          >
            {announcement.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={`${getCategoryColor(announcement.category)} capitalize border`}>
              <Tag className="w-3 h-3 mr-1" />
              {announcement.category}
            </Badge>
            <Badge className={`${getPriorityColor(announcement.priority)} capitalize flex items-center gap-1 border`}>
              {getPriorityIcon(announcement.priority)}
              {announcement.priority}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {announcement.status}
            </Badge>
          </div>

          <p className="text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
            {announcement.content}
          </p>
          
          {announcement.content.length > 300 && (
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 mt-2 font-medium"
              onClick={handleView}
            >
              Read more
            </Button>
          )}
        </div>

        {/* Engagement Metrics */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 rounded-lg px-3 ${
                isLiked ? 'text-red-600 bg-red-50' : 'text-muted-foreground hover:text-red-600 hover:bg-red-50'
              }`}
            >
              {liking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600' : ''}`} />
              )}
              <span className="font-medium">{localLikes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(announcement._id)}
              className="flex items-center gap-2 rounded-lg px-3 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{announcement.comments?.length || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg px-3 text-muted-foreground hover:text-green-600 hover:bg-green-50"
            >
              <Share className="w-4 h-4" />
              <span className="font-medium">Share</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={`flex items-center gap-2 rounded-lg px-3 ${
                isBookmarked ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-600' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Comments Preview */}
        {announcement.comments && announcement.comments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              {announcement.comments.slice(0, 2).map((comment, index) => (
                <motion.div 
                  key={index} 
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                    {comment.author?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{comment.author}</p>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(comment.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
              {announcement.comments.length > 2 && (
                <Button variant="link" size="sm" className="p-0 h-auto text-blue-600 font-medium">
                  View {announcement.comments.length - 2} more comments
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// ================== Announcement Detail View ==================
const AnnouncementDetail = ({ announcement, onClose, onEdit, onDelete }) => {
  if (!announcement) return null;

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      hr: 'bg-blue-100 text-blue-800',
      it: 'bg-purple-100 text-purple-800',
      finance: 'bg-green-100 text-green-800',
      events: 'bg-pink-100 text-pink-800',
      policy: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800',
    };
    return colors[category] || colors.general;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={!!announcement} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {announcement.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 flex-wrap text-sm">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              By {announcement.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(announcement.createdAt)}
            </span>
            {announcement.updatedAt !== announcement.createdAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated {formatDate(announcement.updatedAt)}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className={getCategoryColor(announcement.category)}>
              {announcement.category}
            </Badge>
            <Badge variant={announcement.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {announcement.priority}
            </Badge>
            <Badge variant="outline">
              {announcement.status}
            </Badge>
            {announcement.isPinned && (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
          </div>

          <div className="prose max-w-none">
            <p className="text-foreground whitespace-pre-line leading-relaxed text-lg">
              {announcement.content}
            </p>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{announcement.likes || 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{announcement.comments?.length || 0}</p>
              <p className="text-sm text-muted-foreground font-medium">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {announcement.isPinned ? 'Yes' : 'No'}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Pinned</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
          <Button 
            onClick={() => onEdit(announcement)} 
            className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onClose();
              onDelete(announcement._id);
            }}
            className="px-6"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ================== Main Announcements Feed Component ==================
const AnnouncementsFeed = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ 
    category: 'all', 
    priority: 'all', 
    status: 'all' 
  });
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pinned: 0,
    engagement: 0
  });

  // Fetch announcements on component mount and when filters change
  useEffect(() => {
    fetchAnnouncements();
  }, [filters]);

  // Update stats when announcements change
  useEffect(() => {
    updateStats();
  }, [announcements]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching announcements with filters:', filters);
      
      const filterParams = {
        ...filters,
        search: searchTerm || undefined
      };
      
      const data = await announcementAPI.getAll(filterParams);
      setAnnouncements(data.announcements || data);
      console.log('Announcements loaded successfully:', data.announcements?.length || 0);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Failed to load announcements. Please check if the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const total = announcements.length;
    const published = announcements.filter(a => a.status === 'published').length;
    const pinned = announcements.filter(a => a.isPinned).length;
    const engagement = announcements.reduce((sum, ann) => sum + (ann.likes || 0) + (ann.comments?.length || 0), 0);
    
    setStats({ total, published, pinned, engagement });
  };

  const handleSaveAnnouncement = async (announcementData) => {
    try {
      setSaving(true);
      setError(null);
      
      if (editingAnnouncement) {
        const updatedAnnouncement = await announcementAPI.update(editingAnnouncement._id, announcementData);
        setAnnouncements(prev => prev.map(ann => 
          ann._id === editingAnnouncement._id ? updatedAnnouncement.announcement || updatedAnnouncement : ann
        ));
      } else {
        const newAnnouncement = await announcementAPI.create(announcementData);
        setAnnouncements(prev => [newAnnouncement.announcement || newAnnouncement, ...prev]);
      }
      
      setModalOpen(false);
      setEditingAnnouncement(null);
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError(error.message || 'Failed to save announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      setError(null);
      await announcementAPI.delete(announcementId);
      setAnnouncements(prev => prev.filter(ann => ann._id !== announcementId));
      setViewingAnnouncement(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError(error.message || 'Failed to delete announcement. Please try again.');
    }
  };

  const handleTogglePin = async (announcement) => {
    try {
      setError(null);
      const result = await announcementAPI.togglePin(announcement._id);
      setAnnouncements(prev => prev.map(ann =>
        ann._id === announcement._id 
          ? { ...ann, isPinned: result.isPinned }
          : ann
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
      setError(error.message || 'Failed to toggle pin. Please try again.');
    }
  };

  const handleLike = async (announcementId, liked) => {
    try {
      await announcementAPI.toggleLike(announcementId);
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  const handleComment = async (announcementId) => {
    const comment = prompt('Enter your comment:');
    if (comment && comment.trim()) {
      try {
        setError(null);
        await announcementAPI.addComment(announcementId, comment.trim());
        await fetchAnnouncements();
      } catch (error) {
        console.error('Error adding comment:', error);
        setError(error.message || 'Failed to add comment. Please try again.');
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ category: 'all', priority: 'all', status: 'all' });
    fetchAnnouncements();
  };

  const exportAnnouncements = () => {
    const dataStr = JSON.stringify(announcements, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `announcements-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtering and sorting
  const filteredAnnouncements = announcements.filter(ann => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      ann.title.toLowerCase().includes(searchLower) ||
      ann.content.toLowerCase().includes(searchLower) ||
      ann.author.toLowerCase().includes(searchLower);
    const matchesCategory = filters.category === 'all' || ann.category === filters.category;
    const matchesPriority = filters.priority === 'all' || ann.priority === filters.priority;
    const matchesStatus = filters.status === 'all' || ann.status === filters.status;
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filterOptions = {
    category: ['all', 'general', 'hr', 'it', 'finance', 'events', 'policy', 'emergency'],
    priority: ['all', 'low', 'normal', 'high', 'urgent'],
    status: ['all', 'draft', 'published', 'archived'],
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(f => f !== 'all');

  return (
    <>
      {/* Add/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { 
        if (!open) setEditingAnnouncement(null); 
        setModalOpen(open); 
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              {editingAnnouncement ? (
                <>
                  <Edit className="w-5 h-5 text-blue-600" />
                  Edit Announcement
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-green-600" />
                  Create New Announcement
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement 
                ? 'Update announcement details and visibility settings.' 
                : 'Share important updates, news, and information with your team.'}
            </DialogDescription>
          </DialogHeader>
          <AnnouncementForm
            announcement={editingAnnouncement}
            onSave={handleSaveAnnouncement}
            onCancel={() => setModalOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      {viewingAnnouncement && (
        <AnnouncementDetail
          announcement={viewingAnnouncement}
          onClose={() => setViewingAnnouncement(null)}
          onEdit={(ann) => {
            setViewingAnnouncement(null);
            setEditingAnnouncement(ann);
            setModalOpen(true);
          }}
          onDelete={handleDeleteAnnouncement}
        />
      )}

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Announcements Hub
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Create, manage, and monitor company announcements and updates
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={exportAnnouncements}
              disabled={announcements.length === 0}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => { 
                setEditingAnnouncement(null); 
                setModalOpen(true); 
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4" /> 
              New Announcement
            </Button>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnnouncements}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Announcements</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.published}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Pinned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pinned}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Pin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Total Engagement</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.engagement}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search announcements by title, content, or author..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-12 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" variant="outline" className="h-12 px-6 border-gray-300 hover:bg-gray-50">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-gray-700">Filters:</span>
              </div>
              
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-40 focus:ring-blue-500">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filterOptions.category.filter(opt => opt !== 'all').map(option => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-40 focus:ring-blue-500">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {filterOptions.priority.filter(opt => opt !== 'all').map(option => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-40 focus:ring-blue-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {filterOptions.status.filter(opt => opt !== 'all').map(option => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-gray-700"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground font-medium">
              Showing {sortedAnnouncements.length} of {announcements.length} announcements
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Loading announcements...</p>
            </div>
          </div>
        )}

        {/* Announcements Feed */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <AnimatePresence>
              {sortedAnnouncements.map((announcement, index) => (
                <AnnouncementCard
                  key={announcement._id || index}
                  announcement={announcement}
                  onEdit={(ann) => {
                    setEditingAnnouncement(ann);
                    setModalOpen(true);
                  }}
                  onDelete={handleDeleteAnnouncement}
                  onTogglePin={handleTogglePin}
                  onLike={handleLike}
                  onComment={handleComment}
                  onView={setViewingAnnouncement}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && announcements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              No announcements yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Create your first announcement to share important updates, news, and information with your team.
            </p>
            <Button
              onClick={() => { setEditingAnnouncement(null); setModalOpen(true); }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" /> 
              Create First Announcement
            </Button>
          </motion.div>
        )}

        {/* Empty Search State */}
        {!loading && announcements.length > 0 && sortedAnnouncements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-16 h-16 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              No announcements found
            </h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Try adjusting your search criteria or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              size="lg"
              className="px-8 py-3 text-lg border-gray-300 hover:bg-gray-50"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default AnnouncementsFeed;