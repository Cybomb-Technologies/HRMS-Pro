import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User, Mail, Phone, Briefcase, Calendar, Edit, UserCheck, MapPin,
  Building, Clock, BookOpen, GraduationCap, Users, FileText, Loader2,
  Save, X, Eye, EyeOff, Plus, Trash2, Download, Shield, Camera
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ProfileTab = () => {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState({});
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const getEmployeeId = () => {
    return user?.employeeId || user?.email || 'empid1002';
  };

  // Check if user has admin/HR privileges
  const isAdminOrHR = () => {
    return user?.role === 'admin' || user?.role === 'hr';
  };

  useEffect(() => {
    const employeeId = getEmployeeId();
    if (employeeId) {
      fetchProfile(employeeId);
    }
  }, [user, token]);

  const fetchProfile = async (employeeId) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization header only if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/employee-profiles/${employeeId}`, {
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle authentication errors
        if (response.status === 401) {
          if (errorData.code === 'TOKEN_EXPIRED') {
            toast({
              title: "Session Expired",
              description: "Please login again.",
              variant: "destructive",
            });
            if (logout) logout();
            return;
          }
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data.employee) {
        setProfile(result.data.employee);
        setEditData(result.data.employee);
      } else {
        throw new Error(result.message || 'Failed to load profile data');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      toast({
        title: "Error Loading Profile",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile);
    setShowSensitiveInfo({});
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const employeeId = getEmployeeId();
      
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/employee-profiles/${employeeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please login again.",
            variant: "destructive",
          });
          if (logout) logout();
          return;
        }
        
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setProfile(result.data);
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error Updating Profile",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingProfilePic(true);
      const employeeId = getEmployeeId();
      const formData = new FormData();
      formData.append('profilePicture', file);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/employee-profiles/${employeeId}/profile-picture`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please login again.",
            variant: "destructive",
          });
          if (logout) logout();
          return;
        }
        
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh profile to get updated data
        fetchProfile(employeeId);
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
        });
      } else {
        throw new Error(result.message || 'Failed to upload profile picture');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingProfilePic(false);
      event.target.value = '';
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field, index, subField, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      ) || []
    }));
  };

  const addArrayField = (field, template) => {
    setEditData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), template]
    }));
  };

  const removeArrayField = (field, index) => {
    setEditData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleSensitiveInfo = (field) => {
    setShowSensitiveInfo(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const maskSensitiveInfo = (value) => {
    if (!value) return '••••••••';
    return value.replace(/.(?=.{4})/g, '•');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  // Render non-editable field (for basic info, personal info, and employment details)
  const renderReadOnlyField = (label, value, icon = null) => {
    return (
      <div className="flex justify-between items-start">
        <span className="text-muted-foreground flex items-center">
          {icon && React.createElement(icon, { className: "mr-2 h-4 w-4" })}
          {label}
        </span>
        <span>{value || 'Not specified'}</span>
      </div>
    );
  };

  // Render editable field (only for specific sections like About Me, Education, Work Experience)
  const renderEditableField = (label, value, field, type = 'text', options = []) => {
    if (!isEditing) {
      return (
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground">{label}</span>
          <span>{value || 'Not specified'}</span>
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{label}</span>
          <Select value={editData[field] || ''} onValueChange={(value) => handleInputChange(field, value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm">{label}</label>
          <Textarea
            value={editData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">{label}</span>
        <Input
          type={type}
          value={editData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-48"
        />
      </div>
    );
  };

  const renderSensitiveField = (label, value, field) => {
    const isVisible = showSensitiveInfo[field];
    const canEdit = isEditing;
    
    return (
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={isVisible ? '' : 'font-mono'}>
            {isVisible ? (value || 'Not specified') : maskSensitiveInfo(value)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleSensitiveInfo(field)}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          {canEdit && isEditing && (
            <Input
              value={editData[field] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-48"
              type={isVisible ? 'text' : 'password'}
            />
          )}
        </div>
      </div>
    );
  };

  const handleRetry = async () => {
    const employeeId = getEmployeeId();
    await fetchProfile(employeeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="text-red-500">
          <div className="font-semibold">Error loading profile</div>
          <div className="text-sm mt-2">{error}</div>
        </div>
        <div className="space-x-2">
          <Button onClick={handleRetry} variant="outline">
            Retry
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div>No profile data found</div>
        <Button onClick={handleRetry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const profilePicture = profile.profilePicture || profile.profilePhoto;
  const fullName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Not specified';

  return (
    <div className="space-y-6">
      {/* Profile Header Card - NON-EDITABLE NAME SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Profile</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="mr-2">
              ID: {profile.employeeId}
            </Badge>
            {isAdminOrHR() && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {user?.role?.toUpperCase()}
              </Badge>
            )}
            {!isEditing ? (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture Section */}
            <div className="relative group">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img 
                    src={`http://localhost:5000${profilePicture}`} 
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
                {!profilePicture && (
                  <span className="text-white font-medium text-4xl">
                    {fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              
              {/* Profile Picture Upload Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <label htmlFor="profile-picture-upload" className="cursor-pointer">
                  {uploadingProfilePic ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </label>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                  disabled={uploadingProfilePic}
                />
              </div>
            </div>

            <div className="text-center md:text-left">
              {/* NON-EDITABLE NAME AND DESIGNATION */}
              <h2 className="text-2xl font-bold">{fullName}</h2>
              <p className="text-muted-foreground">{profile.designation || 'Not specified'}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                  {profile.status || 'Unknown'}
                </Badge>
                <Badge variant="outline">
                  {profile.employmentType || 'Not specified'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information - NON-EDITABLE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderReadOnlyField('Work Email', profile.email, Mail)}
            {renderReadOnlyField('Employee ID', profile.employeeId, User)}
            {renderReadOnlyField('Department', profile.department, Building)}
            {renderReadOnlyField('Designation', profile.designation, Briefcase)}
            {renderReadOnlyField('Role', profile.role, UserCheck)}
            {renderReadOnlyField('Reporting Manager', profile.reportingManager, Users)}
          </CardContent>
        </Card>

        {/* Employment Details - NON-EDITABLE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderReadOnlyField('Department', profile.department, Building)}
            {renderReadOnlyField('Location', profile.location, MapPin)}
            {renderReadOnlyField('Date of Joining', formatDate(profile.dateOfJoining), Calendar)}
            
            {renderReadOnlyField('Employment Type', profile.employmentType, Briefcase)}
            {renderReadOnlyField('Status', profile.status, UserCheck)}
          </CardContent>
        </Card>
      </div>

      {/* Personal Information - NON-EDITABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderReadOnlyField('Phone', profile.workPhone, Phone)}
          {renderReadOnlyField('Personal Email', profile.personalEmail, Mail)}
          {renderReadOnlyField('Date of Birth', formatDate(profile.dateOfBirth), Calendar)}
          {renderReadOnlyField('Marital Status', profile.maritalStatus, User)}
          {renderReadOnlyField('Gender', profile.gender, User)}
        </CardContent>
      </Card>

      {/* Identity Information - SENSITIVE DATA (Read-only for non-admin) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Identity Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderSensitiveField('PAN Number', profile.pan, 'pan')}
          {renderSensitiveField('Aadhaar Number', profile.aadhaar, 'aadhaar')}
          {renderSensitiveField('UAN Number', profile.uan, 'uan')}
          
          {/* Identity Documents */}
          {profile.identityDocuments && profile.identityDocuments.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-3">Identity Documents</h4>
              <div className="space-y-2">
                {profile.identityDocuments.map((doc, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.type} • {formatDate(doc.uploadDate)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Details - EDITABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Present Address</h4>
              {isEditing ? (
                <Textarea
                  value={editData.presentAddress || ''}
                  onChange={(e) => handleInputChange('presentAddress', e.target.value)}
                  placeholder="Enter present address..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground">{profile.presentAddress || 'Not specified'}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-3">Permanent Address</h4>
              {isEditing ? (
                <Textarea
                  value={editData.permanentAddress || ''}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  placeholder="Enter permanent address..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground">{profile.permanentAddress || 'Not specified'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education Section - EDITABLE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Education
          </CardTitle>
          {isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addArrayField('education', {
                instituteName: '',
                degree: '',
                specialization: '',
                dateOfCompletion: ''
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Education
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(!profile.education || profile.education.length === 0) && !isEditing ? (
            <p className="text-muted-foreground text-center py-4">No education information added</p>
          ) : (
            (isEditing ? editData.education : profile.education)?.map((edu, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 relative">
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={() => removeArrayField('education', index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={edu.instituteName || ''}
                        onChange={(e) => handleArrayFieldChange('education', index, 'instituteName', e.target.value)}
                        placeholder="Institute Name"
                      />
                      <Input
                        value={edu.degree || ''}
                        onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                        placeholder="Degree"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={edu.specialization || ''}
                        onChange={(e) => handleArrayFieldChange('education', index, 'specialization', e.target.value)}
                        placeholder="Specialization"
                      />
                      <Input
                        type="date"
                        value={formatDateForInput(edu.dateOfCompletion)}
                        onChange={(e) => handleArrayFieldChange('education', index, 'dateOfCompletion', e.target.value)}
                        placeholder="Completion Date"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">{edu.instituteName}</p>
                    {edu.specialization && (
                      <p className="text-sm">Specialization: {edu.specialization}</p>
                    )}
                    {edu.dateOfCompletion && (
                      <p className="text-sm">Completed: {formatDate(edu.dateOfCompletion)}</p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Work Experience Section - EDITABLE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Work Experience
          </CardTitle>
          {isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addArrayField('workExperience', {
                companyName: '',
                jobTitle: '',
                fromDate: '',
                toDate: '',
                jobDescription: '',
                relevant: true
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Experience
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(!profile.workExperience || profile.workExperience.length === 0) && !isEditing ? (
            <p className="text-muted-foreground text-center py-4">No work experience added</p>
          ) : (
            (isEditing ? editData.workExperience : profile.workExperience)?.map((exp, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 relative">
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={() => removeArrayField('workExperience', index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={exp.companyName || ''}
                        onChange={(e) => handleArrayFieldChange('workExperience', index, 'companyName', e.target.value)}
                        placeholder="Company Name"
                      />
                      <Input
                        value={exp.jobTitle || ''}
                        onChange={(e) => handleArrayFieldChange('workExperience', index, 'jobTitle', e.target.value)}
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={formatDateForInput(exp.fromDate)}
                        onChange={(e) => handleArrayFieldChange('workExperience', index, 'fromDate', e.target.value)}
                        placeholder="From Date"
                      />
                      <Input
                        type="date"
                        value={formatDateForInput(exp.toDate)}
                        onChange={(e) => handleArrayFieldChange('workExperience', index, 'toDate', e.target.value)}
                        placeholder="To Date"
                      />
                    </div>
                    <Textarea
                      value={exp.jobDescription || ''}
                      onChange={(e) => handleArrayFieldChange('workExperience', index, 'jobDescription', e.target.value)}
                      placeholder="Job Description"
                      rows={3}
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold">{exp.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                    <p className="text-sm">
                      {formatDate(exp.fromDate)} - {exp.toDate ? formatDate(exp.toDate) : 'Present'}
                    </p>
                    {exp.jobDescription && (
                      <p className="text-sm mt-1">{exp.jobDescription}</p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* About Me Section - EDITABLE */}
      {(!isEditing && profile.aboutMe) || isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              About Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderEditableField('About Me', profile.aboutMe, 'aboutMe', 'textarea')}
          </CardContent>
        </Card>
      ) : null}

      {/* Documents Section */}
      {profile.documents && profile.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Documents ({profile.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.documents.map((doc, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} • {formatDate(doc.uploadDate)} • 
                      {doc.fileSize ? ` ${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileTab;