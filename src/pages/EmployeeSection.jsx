import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { GraduationCap} from 'lucide-react';
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
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  MapPin,
  Edit,
  Eye,
  Trash2,
  Phone,
  Calendar,
  User,
  Building,
  Briefcase,
  Clock,
  Key,
  Copy,
  Check,
  Target,
  UserCheck,
  Award
} from 'lucide-react';

// ================== Employee Form ==================
const EmployeeForm = ({ employee, onSave, onCancel, suggestedId }) => {
  const [formData, setFormData] = useState(
    employee || { 
      employeeId: suggestedId, 
      name: '', 
      email: '', 
      email: '', // NEW FIELD
      workPhone: '', // NEW FIELD
      department: '', 
      designation: '', 
      role: '',
      employmentType: 'Permanent',
      status: 'active', 
      sourceOfHire: 'Direct',
      location: '',
      dateOfJoining: '',
      dateOfBirth: '', // NEW FIELD
      maritalStatus: '', // NEW FIELD
      totalExperience: '',
      password: '' 
    }
  );
  const [generatePassword, setGeneratePassword] = useState(!employee);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  useEffect(() => {
    if (generatePassword && !employee) {
      setFormData(prev => ({
        ...prev,
        password: generateRandomPassword()
      }));
    }
  }, [generatePassword, employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordToggle = (e) => {
    setGeneratePassword(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        password: generateRandomPassword()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
  };

 return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* First Row - 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input 
              id="employeeId" 
              name="employeeId" 
              value={formData.employeeId} 
              onChange={handleChange} 
              required 
              disabled={!!employee} 
            />
          </div>
          
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="email">Work Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="Company@mail.com"
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div>
            <Label htmlFor="personalEmail">Personal Email</Label>
            <Input 
              id="personalEmail" 
              name="personalEmail" 
              type="email" 
              value={formData.personalEmail} 
              onChange={handleChange} 
              placeholder="personal@example.com"
            />
          </div>
          <div>
            <Label htmlFor="reportingManager">Reporting Manager</Label>
            <Input 
              id="reportingManager" 
              name="reportingManager" 
              value={formData.reportingManager} 
              onChange={handleChange} 
              placeholder="e.g., John Smith"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input 
              id="department" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input 
              id="designation" 
              name="designation" 
              value={formData.designation} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div>
            <Label htmlFor="workPhone">Work Phone</Label>
            <Input 
              id="workPhone" 
              name="workPhone" 
              value={formData.workPhone} 
              onChange={handleChange} 
              placeholder="+91 9876543210 "
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input 
              id="dateOfBirth" 
              name="dateOfBirth" 
              type="date" 
              value={formData.dateOfBirth} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <select 
              id="maritalStatus" 
              name="maritalStatus" 
              value={formData.maritalStatus} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select 
              id="gender" 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input 
              id="role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              placeholder="e.g., Team Member, Team Lead, Manager"
            />
          </div>
        </div>
      </div>

      {/* Second Row - Additional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="employmentType">Employment Type</Label>
          <select 
            id="employmentType" 
            name="employmentType" 
            value={formData.employmentType} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Permanent">Permanent</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>

        <div>
          <Label htmlFor="sourceOfHire">Source of Hire</Label>
          <select 
            id="sourceOfHire" 
            name="sourceOfHire" 
            value={formData.sourceOfHire} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Direct">Direct</option>
            <option value="Referral">Referral</option>
            <option value="Agency">Agency</option>
            <option value="Campus">Campus</option>
            <option value="Job Portal">Job Portal</option>
          </select>
        </div>
      </div>

      {/* Third Row - Location and Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="e.g., Cybomb Technologies LLP - Prime Plaza"
          />
        </div>

        <div>
          <Label htmlFor="dateOfJoining">Date of Joining</Label>
          <Input 
            id="dateOfJoining" 
            name="dateOfJoining" 
            type="date" 
            value={formData.dateOfJoining} 
            onChange={handleChange} 
          />
        </div>
      </div>

      {/* Fourth Row - Experience and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="totalExperience">Total Experience</Label>
          <Input 
            id="totalExperience" 
            name="totalExperience" 
            value={formData.totalExperience} 
            onChange={handleChange} 
            placeholder="e.g., 2 month(s), 1 year(s)"
          />
        </div>

        <div>
          <Label htmlFor="status">Employee Status</Label>
          <select 
            id="status" 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="active">Active</option>
            <option value="on-probation">On Probation</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Password Section */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <Label htmlFor="generatePassword" className="text-blue-900 font-medium">
            <Key className="w-4 h-4 inline mr-2" />
            Account Password
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generatePassword"
              checked={generatePassword}
              onChange={handlePasswordToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={!!employee}
            />
            <Label htmlFor="generatePassword" className="text-sm text-blue-800">
              Generate automatic password
            </Label>
          </div>
        </div>

        {generatePassword && formData.password && (
          <div className="bg-white p-3 rounded border">
            <Label className="text-sm text-gray-600 mb-2 block">
              Employee Login Password:
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                value={formData.password}
                readOnly
                className="font-mono bg-gray-50"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPassword}
                className="whitespace-nowrap"
              >
                {passwordCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {passwordCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              📋 Copy this password and share it securely with the employee. They can use it to login with their email.
            </p>
          </div>
        )}

        {!generatePassword && (
          <div>
            <Label htmlFor="password">Set Custom Password</Label>
            <Input
              id="password"
              name="password"
              type="text"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter custom password"
              required={!generatePassword}
            />
          </div>
        )}
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Employee</Button>
      </DialogFooter>
    </form>
  );
};

// ================== Employee View Dialog ==================
const EmployeeViewDialog = ({ employee, isOpen, onClose }) => {
  if (!employee) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-leave': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-probation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'on-leave': return <Clock className="w-3 h-3" />;
      case 'on-probation': return <Clock className="w-3 h-3" />;
      case 'terminated': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-2xl">
        <User className="w-6 h-6" />
        Employee Profile
      </DialogTitle>
      <DialogDescription>
        Complete details for {employee.name}
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Avatar and Basic Info */}
        <div className="flex-1">
  <div className="flex items-center gap-4 mb-4">
    {/* Profile Picture with better error handling */}
    <div className="relative">
      {employee.profilePicture || employee.profilePhoto ? (
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-gradient-to-r from-blue-500 to-purple-600">
          <img 
            src={`http://localhost:5000${employee.profilePicture || employee.profilePhoto}`}
            alt={employee.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide the image and show fallback
              e.target.style.display = 'none';
            }}
          />
          {/* Fallback initials - always present but hidden by default */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ display: employee.profilePicture || employee.profilePhoto ? 'none' : 'flex' }}
          >
            <span className="text-white font-bold text-2xl">
              {employee.name?.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
      ) : (
        /* Default avatar with initials when no profile picture */
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">
            {employee.name?.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
      )}
    </div>
    
    <div className="flex-1">
      <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
      <p className="text-gray-600">{employee.designation}</p>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(employee.status)}`}>
          {getStatusIcon(employee.status)}
          {employee.status?.replace('-', ' ')}
        </Badge>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {employee.employeeId}
        </Badge>
        {employee.employmentType && (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {employee.employmentType}
          </Badge>
        )}
      </div>
    </div>
  </div>
</div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border">
            <Building className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Department</p>
            <p className="font-semibold text-gray-900">{employee.department}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border">
            <MapPin className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold text-gray-900">{employee.location}</p>
          </div>
        
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border">
            <Award className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600">Experience</p>
            <p className="font-semibold text-gray-900">{employee.totalExperience || 'Not specified'}</p>
          </div>
        </div>
      </div>

        {/* About Me */}
        {employee.aboutMe && (
          <Card className="p-6 bg-gradient-to-br from-teal-50 to-green-50 border-0 shadow-sm md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <User className="w-5 h-5 text-teal-600" />
              About Me
            </h3>
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-gray-900 leading-relaxed">{employee.aboutMe}</p>
            </div>
          </Card>
        )}

      {/* Detailed Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Contact Information */}
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Mail className="w-5 h-5 text-blue-600" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Work Email</p>
                <p className="font-medium text-gray-900">{employee.email}</p>
              </div>
            </div>
            {employee.personalEmail && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Personal Email</p>
                  <p className="font-medium text-gray-900">{employee.personalEmail}</p>
                </div>
              </div>
            )}
            {employee.workPhone && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Work Phone</p>
                  <p className="font-medium text-gray-900">{employee.workPhone}</p>
                </div>
              </div>
            )}
            {employee.personalMobile && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Personal Mobile</p>
                  <p className="font-medium text-gray-900">{employee.personalMobile}</p>
                </div>
              </div>
            )}
            {employee.extension && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Extension</p>
                  <p className="font-medium text-gray-900">{employee.extension}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Personal Details */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <User className="w-5 h-5 text-orange-600" />
            Personal Details
          </h3>
          <div className="space-y-3">
            {employee.dateOfBirth && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Date of Birth</span>
                <span className="font-medium text-gray-900">
                  {formatDate(employee.dateOfBirth)}
                  {employee.age && ` (${employee.age} years)`}
                </span>
              </div>
            )}
            {employee.maritalStatus && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Marital Status</span>
                <span className="font-medium text-gray-900">{employee.maritalStatus}</span>
              </div>
            )}
            {employee.gender && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Gender</span>
                <span className="font-medium text-gray-900">{employee.gender}</span>
              </div>
            )}
            {employee.nickName && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Nickname</span>
                <span className="font-medium text-gray-900">{employee.nickName}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Work Information */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Work Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Building className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium text-gray-900">{employee.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Designation</p>
                <p className="font-medium text-gray-900">{employee.designation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Target className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium text-gray-900">{employee.role || 'Not specified'}</p>
              </div>
            </div>
            {employee.zohoRole && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Zoho Role</p>
                  <p className="font-medium text-gray-900">{employee.zohoRole}</p>
                </div>
              </div>
            )}
            {employee.reportingManager && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Reporting Manager</p>
                  <p className="font-medium text-gray-900">{employee.reportingManager}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Employment Information */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <UserCheck className="w-5 h-5 text-green-600" />
            Employment Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-600">Employment Type</span>
              <span className="font-medium text-gray-900">{employee.employmentType || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-600">Source of Hire</span>
              <span className="font-medium text-gray-900">{employee.sourceOfHire || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-600">Date of Joining</span>
              <span className="font-medium text-gray-900">{formatDate(employee.dateOfJoining)}</span>
            </div>
            {employee.seatingLocation && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Seating Location</span>
                <span className="font-medium text-gray-900">{employee.seatingLocation}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Identity Information */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Key className="w-5 h-5 text-purple-600" />
            Identity Information
          </h3>
          <div className="space-y-3">
            {employee.pan && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">PAN Number</span>
                <span className="font-medium text-gray-900">{employee.pan}</span>
              </div>
            )}
            {employee.aadhaar && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Aadhaar Number</span>
                <span className="font-medium text-gray-900">{employee.aadhaar}</span>
              </div>
            )}
            {employee.uan && (
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">UAN Number</span>
                <span className="font-medium text-gray-900">{employee.uan}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Address Information */}
        {(employee.address || employee.presentAddress || employee.permanentAddress) && (
          <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <MapPin className="w-5 h-5 text-cyan-600" />
              Address Information
            </h3>
            <div className="space-y-3">
              {employee.presentAddress && (
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">Present Address</p>
                  <p className="font-medium text-gray-900">{employee.presentAddress}</p>
                </div>
              )}
              {employee.permanentAddress && (
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">Permanent Address</p>
                  <p className="font-medium text-gray-900">{employee.permanentAddress}</p>
                </div>
              )}
              {employee.address && (
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Detailed Address</p>
                  <div className="text-sm text-gray-900">
                    {employee.address.street && <p>{employee.address.street}</p>}
                    {employee.address.city && <p>{employee.address.city}</p>}
                    {employee.address.state && <p>{employee.address.state}</p>}
                    {employee.address.country && <p>{employee.address.country}</p>}
                    {employee.address.zipCode && <p>ZIP: {employee.address.zipCode}</p>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Education Section */}
      {employee.education?.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Education
          </h3>
          <div className="space-y-3">
            {employee.education.map((edu, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  {edu.dateOfCompletion && (
                    <span className="text-sm text-gray-500">
                      {formatDate(edu.dateOfCompletion)}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-1">{edu.instituteName}</p>
                {edu.specialization && (
                  <p className="text-sm text-gray-600">Specialization: {edu.specialization}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Work Experience Section */}
      {employee.workExperience?.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Briefcase className="w-5 h-5 text-slate-600" />
            Work Experience
          </h3>
          <div className="space-y-3">
            {employee.workExperience.map((exp, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{exp.jobTitle}</h4>
                  <div className="text-right text-sm text-gray-500">
                    <p>{formatDate(exp.fromDate)} - {exp.toDate ? formatDate(exp.toDate) : 'Present'}</p>
                    {exp.relevant !== undefined && (
                      <Badge variant={exp.relevant ? "default" : "outline"} className="mt-1">
                        {exp.relevant ? 'Relevant' : 'Not Relevant'}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{exp.companyName}</p>
                {exp.jobDescription && (
                  <p className="text-sm text-gray-600">{exp.jobDescription}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dependents Section */}
      {employee.dependents?.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Users className="w-5 h-5 text-rose-600" />
            Dependents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {employee.dependents.map((dependent, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border">
                <p className="font-medium text-gray-900 mb-1">{dependent.name}</p>
                <p className="text-sm text-gray-600">Relationship: {dependent.relationship}</p>
                {dependent.dateOfBirth && (
                  <p className="text-sm text-gray-600">
                    Date of Birth: {formatDate(dependent.dateOfBirth)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Mail className="w-4 h-4 mr-2" />
          Send Message
        </Button>
        <Button variant="outline" className="flex-1">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
  );
};

// ================== Employee Section ==================
const EmployeeSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', department: 'all', location: 'all', employmentType: 'all' });
  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);

  // ================== Fetch Employees ==================
  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees');
      const data = await res.json();
      setEmployees(data || []); // Ensure we always have an array
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      toast({ title: 'Error', description: 'Failed to fetch employees' });
      setEmployees([]); // Set empty array on error
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // ================== Suggested ID ==================
  const suggestedId = useMemo(() => {
    if (!employees.length) return 'EMP001';
    
    const lastEmployee = employees[employees.length - 1];
    if (!lastEmployee || !lastEmployee.employeeId?.startsWith('EMP')) return 'EMP001';
    
    const lastIdNum = parseInt(lastEmployee.employeeId.replace('EMP', ''), 10);
    return `EMP${String(lastIdNum + 1).padStart(3, '0')}`;
  }, [employees]);

  // ================== Save Employee ==================
  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        // Update
        const res = await fetch(`http://localhost:5000/api/employees/${employeeData.employeeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData)
        });
        if (!res.ok) throw new Error('Update failed');
        toast({ title: 'Employee Updated', description: `${employeeData.name} updated successfully.` });
      } else {
        // Add
        const res = await fetch('http://localhost:5000/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData)
        });
        const result = await res.json();
        if (!res.ok) throw new Error('Add failed');
        
        toast({ 
          title: 'Employee Added', 
          description: `${employeeData.name} added successfully. Login email: ${employeeData.email}`,
        });
      }
      setModalOpen(false);
      setEditingEmployee(null);
      fetchEmployees(); // Refresh list
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  // ================== Delete Employee ==================
  const handleDeleteEmployee = async (employeeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${employeeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Deleted', description: 'Employee removed successfully' });
      fetchEmployees();
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  // ================== View Employee ==================
  const handleViewEmployee = (employee) => {
    setViewingEmployee(employee);
    setViewModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-leave': return 'bg-blue-100 text-blue-800';
      case 'on-probation': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // FIXED: Safe filtering with optional chaining and null checks
  const filteredEmployees = employees.filter(emp => {
    if (!emp) return false; // Skip if employee is undefined
    
    const searchLower = searchTerm.toLowerCase();
    
    // Safe property access with optional chaining and fallbacks
    const name = emp.name || '';
    const email = emp.email || '';
    const employeeId = emp.employeeId || '';
    const department = emp.department || '';
    const location = emp.location || '';
    const status = emp.status || '';
    const employmentType = emp.employmentType || '';

    const matchesSearch =
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      employeeId.toLowerCase().includes(searchLower);
    
    const matchesStatus = filters.status === 'all' || status === filters.status;
    const matchesDept = filters.department === 'all' || department === filters.department;
    const matchesLocation = filters.location === 'all' || location === filters.location;
    const matchesEmploymentType = filters.employmentType === 'all' || employmentType === filters.employmentType;
    
    return matchesSearch && matchesStatus && matchesDept && matchesLocation && matchesEmploymentType;
  });

  const filterOptions = {
    status: ['all', 'active', 'on-probation', 'on-leave', 'terminated'],
    department: ['all', ...new Set(employees.filter(e => e?.department).map(e => e.department))],
    location: ['all', ...new Set(employees.filter(e => e?.location).map(e => e.location))],
    employmentType: ['all', 'Permanent', 'Contract', 'Intern', 'Temporary'],
  };

  return (
    <>
      <Helmet><title>Employees - HRMS Pro</title></Helmet>

      {/* Edit/Add Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) setEditingEmployee(null); setModalOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>{editingEmployee ? 'Update employee details' : 'Fill in new employee information'}</DialogDescription>
          </DialogHeader>
          <EmployeeForm 
            employee={editingEmployee} 
            onSave={handleSaveEmployee} 
            onCancel={() => setModalOpen(false)} 
            suggestedId={suggestedId} 
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <EmployeeViewDialog 
        employee={viewingEmployee} 
        isOpen={isViewModalOpen} 
        onClose={() => setViewModalOpen(false)} 
      />

      <div className="space-y-8">
        {/* Header + Add */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground mt-2">Manage employee profiles and track lifecycle</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button onClick={() => { setEditingEmployee(null); setModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select name="status" value={filters.status} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg bg-background capitalize">
              {filterOptions.status.map(option => <option key={option} value={option}>{option.replace('-', ' ')}</option>)}
            </select>
            <select name="department" value={filters.department} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg bg-background">
              {filterOptions.department.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <select name="location" value={filters.location} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg bg-background">
              {filterOptions.location.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <select name="employmentType" value={filters.employmentType} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg bg-background">
              {filterOptions.employmentType.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Employee Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEmployees.map((employee, index) => (
            <motion.div key={employee.employeeId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
              <Card className="p-6 card-hover cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {employee.name?.split(' ').map(n => n?.[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className={`${getStatusColor(employee.status)} capitalize`}>
                          {employee.status?.replace('-', ' ')}
                        </Badge>
                        {employee.employmentType && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {employee.employmentType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingEmployee(employee); setModalOpen(true); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-600"> 
                            <Trash2 className="mr-2 h-4 w-4" /> Delete 
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will delete {employee.name}'s profile.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteEmployee(employee.employeeId)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="text-sm font-medium text-foreground">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Designation</p>
                      <p className="text-sm font-medium text-foreground">{employee.designation}</p>
                    </div>
                  </div>
                  {(employee.role || employee.dateOfJoining) && (
                    <div className="grid grid-cols-2 gap-4">
                      {employee.role && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Role</p>
                          <p className="text-sm font-medium text-foreground">{employee.role}</p>
                        </div>
                      )}
                      {employee.dateOfJoining && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Join Date</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(employee.dateOfJoining).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 pt-2 border-t border-border">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="text-xs">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{employee.location}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredEmployees.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search criteria</p>
            <Button onClick={() => { setEditingEmployee(null); setModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default EmployeeSection;