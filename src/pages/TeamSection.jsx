import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
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
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Eye,
  X,
  Target,
  DollarSign,
  Calendar,
  UserCheck,
  Users2,
  Briefcase,
  Building,
  MapPinned,
  Wallet,
  Activity
} from 'lucide-react';

const TeamForm = ({ team, onSave, onCancel, employees, departments, locations }) => {
  // Safe array accessors with fallbacks and validation
  const safeEmployees = useMemo(() => {
    return Array.isArray(employees) 
      ? employees.filter(emp => emp && emp.employeeId && emp.name)
      : [];
  }, [employees]);

const safeDepartments = useMemo(() => {
  return Array.isArray(departments) 
    ? departments.filter(dept => dept && (dept._id || dept.name))
    : [];
}, [departments]);

const safeLocations = useMemo(() => {
  return Array.isArray(locations) 
    ? locations.filter(loc => loc && (loc._id || loc.name))
    : [];
}, [locations]);

  const [formData, setFormData] = useState(
    team || { 
      name: '', 
      lead: '', 
      department: '', 
      location: '', 
      status: 'active'
    }
  );

  const handleChange = (e) => {
    try {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error handling form change:', error);
    }
  };

  const handleSelectChange = (name, value) => {
    try {
      setFormData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error handling select change:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Safely get selected lead details
  const selectedLead = useMemo(() => {
    if (!formData.lead) return null;
    return safeEmployees.find(emp => emp && emp.employeeId === formData.lead) || null;
  }, [formData.lead, safeEmployees]);

  // Generate safe values for dropdowns
  const getEmployeeValue = (employee) => {
    if (!employee || !employee.employeeId) return '';
    return employee.employeeId.trim() || '';
  };

  const getDepartmentValue = (department) => {
    if (!department) return '';
    return (department.name || '').trim() || '';
  };

  const getLocationValue = (location) => {
    if (!location) return '';
    return (location.name || '').trim() || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Team Name Field */}
      <div className="relative">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          Team Name *
        </Label>
        <Input 
          id="name" 
          name="name" 
          value={formData.name || ''} 
          onChange={handleChange} 
          required 
          placeholder="Enter team name"
          className="pl-10"
        />
        <Target className="absolute left-3 top-9 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      
      {/* Team Lead Field */}
      <div>
        <Label htmlFor="lead" className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-green-600" />
          Team Lead *
        </Label>
        <Select 
          value={formData.lead || ''} 
          onValueChange={(value) => handleSelectChange('lead', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team lead">
              {selectedLead ? `${selectedLead.name || 'Unknown'} - ${selectedLead.designation || 'No Designation'}` : 'Select team lead'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {safeEmployees.map((employee) => {
              const employeeValue = getEmployeeValue(employee);
              if (!employeeValue) return null;
              
              return (
                <SelectItem 
                  key={employeeValue} 
                  value={employeeValue}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    {employee.name || 'Unknown'} - {employee.designation || 'No Designation'} ({employee.department || 'No Department'}) - {employee.employeeId || 'No ID'}
                  </div>
                </SelectItem>
              );
            })}
            {safeEmployees.length === 0 && (
              <SelectItem value="no-employees" disabled>No employees available</SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedLead && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm text-blue-700 flex items-start gap-2">
            <UserCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Selected:</strong> {selectedLead.name || 'Unknown'} - {selectedLead.designation || 'No Designation'} | {selectedLead.department || 'No Department'} | {selectedLead.email || 'No Email'}
            </div>
          </div>
        )}
      </div>


<div>
  <Label htmlFor="department" className="flex items-center gap-2">
    <Building className="w-4 h-4 text-purple-600" />
    Department *
  </Label>
  <Select 
    value={formData.department || ''} 
    onValueChange={(value) => handleSelectChange('department', value)}
    required
  >
    <SelectTrigger>
      <SelectValue placeholder="Select department">
        {formData.department || 'Select department'}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {safeDepartments.map((dept) => {
        const deptName = dept?.name || '';
        if (!deptName) return null;
        
        return (
          <SelectItem key={dept._id || deptName} value={deptName}>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-500" />
              {deptName}
            </div>
          </SelectItem>
        );
      })}
      {safeDepartments.length === 0 && (
        <SelectItem value="no-departments" disabled>No departments available</SelectItem>
      )}
    </SelectContent>
  </Select>
</div>

<div>
  <Label htmlFor="location" className="flex items-center gap-2">
    <MapPinned className="w-4 h-4 text-orange-600" />
    Location *
  </Label>
  <Select 
    value={formData.location || ''} 
    onValueChange={(value) => handleSelectChange('location', value)}
    required
  >
    <SelectTrigger>
      <SelectValue placeholder="Select location">
        {formData.location || 'Select location'}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {safeLocations.map((loc) => {
        const locName = loc?.name || '';
        if (!locName) return null;
        
        return (
          <SelectItem key={loc._id || locName} value={locName}>
            <div className="flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-orange-500" />
              {locName}
            </div>
          </SelectItem>
        );
      })}
      {safeLocations.length === 0 && (
        <SelectItem value="no-locations" disabled>No locations available</SelectItem>
      )}
    </SelectContent>
  </Select>
</div>
      
      {/* Status Field */}
      <div>
        <Label htmlFor="status" className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Status
        </Label>
        <div className="relative">
          <select 
            id="status" 
            name="status" 
            value={formData.status || 'active'} 
            onChange={handleChange}
            className="w-full px-10 py-2 border border-gray-300 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          {team ? (
            <>
              <Edit className="w-4 h-4" />
              Update Team
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Team
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

const TeamMembersModal = ({ team, members, allEmployees, onAddMember, onRemoveMember, onClose }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Filter out employees who are already in the team with proper validation
  const availableEmployees = useMemo(() => {
    if (!team || !team.members || !Array.isArray(allEmployees)) return [];
    
    return allEmployees.filter(emp => 
      emp && emp.employeeId && !team.members.includes(emp.employeeId)
    );
  }, [team, allEmployees]);

  const handleAdd = async () => {
    if (selectedEmployee) {
      await onAddMember(team._id, selectedEmployee);
      setSelectedEmployee('');
    }
  };

  const getEmployeeValue = (employee) => {
    if (!employee || !employee.employeeId) return '';
    return employee.employeeId.trim() || '';
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-blue-600" />
          Members of {team?.name || 'Team'}
        </DialogTitle>
        <DialogDescription>View and manage team members.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex space-x-2">
          <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select employee to add" />
            </SelectTrigger>
            <SelectContent>
              {availableEmployees.map(emp => {
                const empValue = getEmployeeValue(emp);
                if (!empValue) return null;
                
                return (
                  <SelectItem key={empValue} value={empValue}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-500" />
                      {emp.name} - {emp.designation} ({emp.department}) - {emp.employeeId}
                    </div>
                  </SelectItem>
                );
              })}
              {availableEmployees.length === 0 && (
                <SelectItem value="no-available" disabled>No employees available to add</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedEmployee} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> 
            Add
          </Button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Current Members ({members?.length || 0})
          </h4>
          {members && members.map(member => (
            member && (
              <div key={member.employeeId} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({member.designation})</span>
                    <div className="text-xs text-gray-500">{member.department} • {member.email} • ID: {member.employeeId}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveMember(team._id, member.employeeId)} 
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          ))}
          {(!members || members.length === 0) && (
            <div className="text-center text-gray-500 py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No members in this team yet.</p>
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const FilterModal = ({ filters, onFiltersChange, onClose, onClear, teams, employees, departments, locations }) => {
  // Safe array accessors with validation
  const safeTeams = useMemo(() => Array.isArray(teams) ? teams : [], [teams]);
  const safeEmployees = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);
  const safeDepartments = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
  const safeLocations = useMemo(() => Array.isArray(locations) ? locations : [], [locations]);

  // Safely get team leads with proper error handling
  const teamLeads = useMemo(() => {
    try {
      const leads = safeTeams
        .filter(team => team && typeof team === 'object' && team.lead)
        .map(t => t.lead)
        .filter(leadId => leadId && typeof leadId === 'string' && leadId.trim() !== '');
      
      return ['all', ...new Set(leads)];
    } catch (error) {
      console.error('Error processing team leads:', error);
      return ['all'];
    }
  }, [safeTeams]);

  // Safely find employee for a lead ID
  const getLeadEmployee = (leadId) => {
    try {
      if (!leadId || leadId === 'all') return null;
      return safeEmployees.find(emp => emp && emp.employeeId === leadId) || null;
    } catch (error) {
      console.error('Error finding lead employee:', error);
      return null;
    }
  };

  const handleFilterChange = (key, value) => {
    try {
      onFiltersChange({ ...filters, [key]: value });
    } catch (error) {
      console.error('Error updating filters:', error);
    }
  };

  const handleClear = () => {
    try {
      onClear();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  // Safe value getters
  const getDepartmentValue = (department) => {
    if (!department) return '';
    return (department.name || '').trim() || '';
  };

  const getLocationValue = (location) => {
    if (!location) return '';
    return (location.name || '').trim() || '';
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Filter Teams
        </DialogTitle>
        <DialogDescription>Apply filters to narrow down the team list.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">

<div>
  <Label className="flex items-center gap-2">
    <Building className="w-4 h-4 text-purple-600" />
    Department
  </Label>
  <Select 
    value={filters?.department || 'all'} 
    onValueChange={(value) => handleFilterChange('department', value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Departments" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Departments</SelectItem>
      {safeDepartments.map(dept => {
        const deptName = dept?.name || '';
        if (!deptName) return null;
        
        return (
          <SelectItem key={deptName} value={deptName}>
            {deptName}
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
</div>


<div>
  <Label className="flex items-center gap-2">
    <MapPinned className="w-4 h-4 text-orange-600" />
    Location
  </Label>
  <Select 
    value={filters?.location || 'all'} 
    onValueChange={(value) => handleFilterChange('location', value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Locations" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Locations</SelectItem>
      {safeLocations.map(location => {
        const locName = location?.name || '';
        if (!locName) return null;
        
        return (
          <SelectItem key={locName} value={locName}>
            {locName}
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
</div>
        {/* Team Lead Filter */}
        <div>
          <Label className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            Team Lead
          </Label>
          <Select 
            value={filters?.lead || 'all'} 
            onValueChange={(value) => handleFilterChange('lead', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Team Leads" />
            </SelectTrigger>
            <SelectContent>
              {teamLeads.map(leadId => {
                if (leadId === 'all') {
                  return <SelectItem key="all" value="all">All Team Leads</SelectItem>;
                }
                
                const leadEmployee = getLeadEmployee(leadId);
                const displayText = leadEmployee 
                  ? `${leadEmployee.name || 'Unknown'} - ${leadEmployee.designation || 'No Designation'}`
                  : leadId;
                
                return (
                  <SelectItem key={leadId} value={leadId}>
                    {displayText}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
       
        
        {/* Status Filter */}
        <div>
          <Label className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Status
          </Label>
          <Select 
            value={filters?.status || 'all'} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClear} className="flex items-center gap-2">
          <X className="w-4 h-4" />
          Clear Filters
        </Button>
        <Button onClick={onClose} className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Apply Filters
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const TeamSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    lead: 'all',
    location: 'all',
    status: 'all'
  });

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== 'all' && value !== ''
    ).length;
  }, [filters]);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [viewingMembersTeam, setViewingMembersTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      toast({ title: 'Error', description: 'Failed to fetch teams' });
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast({ title: 'Error', description: 'Failed to fetch employees' });
      setEmployees([]);
    }
  };

const fetchDepartments = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/organization/departments');
    if (!res.ok) throw new Error('Failed to fetch departments');
    const data = await res.json();
    console.log('Departments data:', data);
    
    // Handle nested data structure
    const departmentsArray = Array.isArray(data.data) ? data.data : 
                           Array.isArray(data) ? data : 
                           Array.isArray(data.departments) ? data.departments : [];
    
    setDepartments(departmentsArray);
  } catch (err) {
    console.error('Error fetching departments:', err);
    toast({ title: 'Error', description: 'Failed to fetch departments' });
    setDepartments([]);
  }
};

const fetchLocations = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/organization/locations');
    if (!res.ok) throw new Error('Failed to fetch locations');
    const data = await res.json();
    console.log('Locations data:', data);
    
    // Handle nested data structure
    const locationsArray = Array.isArray(data.data) ? data.data : 
                          Array.isArray(data) ? data : 
                          Array.isArray(data.locations) ? data.locations : [];
    
    setLocations(locationsArray);
  } catch (err) {
    console.error('Error fetching locations:', err);
    toast({ title: 'Error', description: 'Failed to fetch locations' });
    setLocations([]);
  }
};

  useEffect(() => { 
    fetchTeams();
    fetchEmployees();
    fetchDepartments();
    fetchLocations();
  }, []);

  const handleCreateTeam = async (teamData) => {
    try {
      const res = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create team');
      }

      const result = await res.json();
      toast({ 
        title: 'Team Created', 
        description: result.message 
      });
      setCreateModalOpen(false);
      fetchTeams(); // Refresh the list
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  const handleUpdateTeam = async (teamData) => {
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${editingTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update team');
      }

      const result = await res.json();
      toast({ 
        title: 'Team Updated', 
        description: result.message 
      });
      setEditingTeam(null);
      fetchTeams(); // Refresh the list
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${teamId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete team');
      }

      const result = await res.json();
      toast({ 
        title: 'Team Deleted', 
        description: result.message 
      });
      fetchTeams(); // Refresh the list
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  const handleAddMember = async (teamId, employeeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add member');
      }

      const result = await res.json();
      toast({ 
        title: 'Member Added', 
        description: result.message 
      });
      
      // Refresh the current team data
      const updatedTeamRes = await fetch(`http://localhost:5000/api/teams/${teamId}`);
      if (updatedTeamRes.ok) {
        const updatedTeam = await updatedTeamRes.json();
        setViewingMembersTeam(updatedTeam);
      }
      
      fetchTeams(); // Refresh the main list
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  const handleRemoveMember = async (teamId, employeeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      const result = await res.json();
      toast({ 
        title: 'Member Removed', 
        description: result.message 
      });
      
      // Refresh the current team data
      const updatedTeamRes = await fetch(`http://localhost:5000/api/teams/${teamId}`);
      if (updatedTeamRes.ok) {
        const updatedTeam = await updatedTeamRes.json();
        setViewingMembersTeam(updatedTeam);
      }
      
      fetchTeams(); // Refresh the main list
    } catch (err) {
      toast({ title: 'Error', description: err.message });
    }
  };

  const handleClearFilters = () => {
    setFilters({ department: 'all', lead: 'all', location: 'all', status: 'all' });
    toast({ title: 'Filters Cleared', description: 'All filters have been reset.' });
  };

  // Update getLeadName with safety checks
  const getLeadName = (leadId) => {
    if (!leadId || !Array.isArray(employees)) return '';
    const leadEmployee = employees.find(emp => emp && emp.employeeId === leadId);
    return leadEmployee ? leadEmployee.name : leadId;
  };

  // Helper function to get lead details
  const getLeadDetails = (leadId) => {
    return employees.find(emp => emp.employeeId === leadId);
  };

  // Get team members details for the modal
  const getTeamMembersDetails = (team) => {
    if (!team || !team.members) return [];
    return team.members.map(memberId => 
      employees.find(emp => emp.employeeId === memberId)
    ).filter(Boolean);
  };

  const filteredTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];
    
    return teams.filter(team => {
      if (!team || typeof team !== 'object') return false;
      
      const searchLower = searchTerm.toLowerCase();
      const teamName = team.name || '';
      const teamDepartment = team.department || '';
      const teamLead = team.lead || '';
      const teamLocation = team.location || '';
      const teamStatus = team.status || 'active';
      
      const matchesSearch = 
        teamName.toLowerCase().includes(searchLower) ||
        (teamLead && getLeadName(teamLead)?.toLowerCase().includes(searchLower)) ||
        teamDepartment.toLowerCase().includes(searchLower);
      
      const matchesDepartment = filters.department === 'all' || teamDepartment === filters.department;
      const matchesLead = filters.lead === 'all' || teamLead === filters.lead;
      const matchesLocation = filters.location === 'all' || teamLocation === filters.location;
      const matchesStatus = filters.status === 'all' || teamStatus === filters.status;

      return matchesSearch && matchesDepartment && matchesLead && matchesLocation && matchesStatus;
    });
  }, [teams, searchTerm, filters, employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Teams - HRMS Pro</title>
        <meta name="description" content="Manage teams, assign leads, track budgets and organize your workforce effectively with HRMS Pro" />
      </Helmet>

      {/* Create Team Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Create New Team
            </DialogTitle>
            <DialogDescription>Fill in the details to create a new team.</DialogDescription>
          </DialogHeader>
          <TeamForm 
            onSave={handleCreateTeam} 
            onCancel={() => setCreateModalOpen(false)}
            employees={employees}
            departments={departments}
            locations={locations}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Team
            </DialogTitle>
            <DialogDescription>Update the details for the team.</DialogDescription>
          </DialogHeader>
          <TeamForm 
            team={editingTeam} 
            onSave={handleUpdateTeam} 
            onCancel={() => setEditingTeam(null)}
            employees={employees}
            departments={departments}
            locations={locations}
          />
        </DialogContent>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog open={!!viewingMembersTeam} onOpenChange={() => setViewingMembersTeam(null)}>
        {viewingMembersTeam && (
          <TeamMembersModal
            team={viewingMembersTeam}
            members={getTeamMembersDetails(viewingMembersTeam)}
            allEmployees={employees}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onClose={() => setViewingMembersTeam(null)}
          />
        )}
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterModalOpen} onOpenChange={setFilterModalOpen}>
        <FilterModal
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setFilterModalOpen(false)}
          onClear={handleClearFilters}
          teams={teams}
          employees={employees}
          departments={departments}
          locations={locations}
        />
      </Dialog>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Users2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-2">Manage teams, assign leads, and track performance</p>
            </div>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search teams, leads, departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{team.name}</h3>
                      <Badge 
                        variant={team.status === 'active' ? 'default' : 'secondary'} 
                        className={`mt-1 ${team.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                      >
                        {team.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTeam(team)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Team
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewingMembersTeam(team)}>
                        <Users className="w-4 h-4 mr-2" />
                        View Members
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Team
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the team and remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTeam(team._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Team
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>Lead: {getLeadName(team.lead)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>Department: {team.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinned className="w-4 h-4 text-orange-600" />
                    <span>Location: {team.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Members: {team.members?.length || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewingMembersTeam(team)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Members
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingTeam(team)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredTeams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Users2 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || activeFiltersCount > 0 
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : 'Get started by creating your first team.'}
            </p>
            {!searchTerm && activeFiltersCount === 0 && (
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Team
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default TeamSection;