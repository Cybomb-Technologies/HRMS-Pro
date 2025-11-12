import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
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
  FileText,
  User,
  Building2,
  Search,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Building,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Key,
  Target,
  UserCheck,
  Award,
  GraduationCap
} from 'lucide-react';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [searchResults, setSearchResults] = useState({
    employees: [],
    departments: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('employee');

  // Get current user's role
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('hrms_user') || '{}');
    setUserRole(currentUser.role || 'employee');
  }, []);

  // Fetch search results from API
  const fetchSearchResults = async () => {
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const results = await response.json();
        
        // Categorize results by type
        const categorizedResults = {
          employees: results.filter(item => item.type === 'employee'),
          departments: results.filter(item => item.type === 'department'),
          documents: results.filter(item => item.type === 'document')
        };
        
        setSearchResults(categorizedResults);
      } else {
        throw new Error('Failed to fetch search results');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to load search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [query]);

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Employee deleted',
          description: `${employeeName} has been deleted successfully`,
        });
        fetchSearchResults(); // Refresh search results
      } else {
        throw new Error('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-leave': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-probation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'hr': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'employer': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'employee': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    return `http://localhost:5000${profilePicture}`;
  };

  // Check if current user can manage employees
  const canManageEmployees = ['admin', 'hr', 'employer'].includes(userRole);

  const renderEmployeeCard = (employee) => {
    return (
      <motion.div
        key={employee.employeeId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col"
      >
        {/* Header with dropdown in top right */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              {employee.profilePicture || employee.profilePhoto ? (
                <img
                  src={getProfilePictureUrl(employee.profilePicture || employee.profilePhoto)}
                  alt={employee.name}
                  className="w-12 h-12 rounded-xl object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center ${
                  (employee.profilePicture || employee.profilePhoto) ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-white font-bold text-sm">
                  {employee.name ? employee.name.split(' ').map((n) => n?.[0] || '').join('') : 'US'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {employee.name}
              </h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className={getStatusColor(employee.status)}>
                  {employee.status?.replace('-', ' ')}
                </Badge>
                <Badge variant="outline" className={getRoleColor(employee.role)}>
                  {employee.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dropdown menu in top right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/employees/${employee.employeeId}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canManageEmployees && (
                <DropdownMenuItem asChild>
                  <Link to={`/employees/${employee.employeeId}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              {canManageEmployees && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {employee.name}'s record. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteEmployee(employee.employeeId, employee.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Employee details */}
        <div className="flex flex-col gap-1 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {employee.designation || 'No designation'}
          </span>
          <span className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            {employee.department || 'No department'}
          </span>
          {employee.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {employee.email}
            </span>
          )}
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit">
            {employee.employeeId}
          </span>
        </div>
      </motion.div>
    );
  };

  const renderDepartmentCard = (department) => {
    return (
      <Link to={`/organization?dept=${department.id}`} key={`department-${department.id}`}>
        <Card className="p-4 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200 cursor-pointer border border-border">
          <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
            <Building2 className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{department.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {department.description || `Department`}
            </p>
            {department.employeeCount && (
              <p className="text-xs text-muted-foreground truncate">
                {department.employeeCount} employees
              </p>
            )}
          </div>
        </Card>
      </Link>
    );
  };

  const renderDocumentCard = (document) => {
    return (
      <Link to={`/documents/${document.id}`} key={`document-${document.id}`}>
        <Card className="p-4 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200 cursor-pointer border border-border">
          <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{document.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              Type: {document.type || 'Document'}
            </p>
            {document.uploadDate && (
              <p className="text-xs text-muted-foreground truncate">
                {new Date(document.uploadDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </Card>
      </Link>
    );
  };

  const totalResults = Object.values(searchResults).reduce((total, category) => total + category.length, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <Helmet>
          <title>Searching for "{query}" - HRMS Pro</title>
        </Helmet>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Searching...</h1>
          <p className="text-muted-foreground mt-2">
            Searching for: <span className="text-primary font-semibold">"{query}"</span>
          </p>
        </motion.div>

        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Helmet>
          <title>Search Error - HRMS Pro</title>
        </Helmet>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
          <p className="text-muted-foreground mt-2">
            Showing results for: <span className="text-primary font-semibold">"{query}"</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Search Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchSearchResults}>Try Again</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Search Results for "{query}" - HRMS Pro</title>
        <meta name="description" content={`Search results for ${query} in HRMS Pro.`} />
      </Helmet>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
          <p className="text-muted-foreground mt-2">
            {totalResults === 0 ? (
              <>No results found for: <span className="text-primary font-semibold">"{query}"</span></>
            ) : (
              <>
                Found {totalResults} result{totalResults !== 1 ? 's' : ''} for:{" "}
                <span className="text-primary font-semibold">"{query}"</span>
              </>
            )}
          </p>
        </motion.div>

        {totalResults === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Results Found</h2>
            <p className="text-muted-foreground">
              Try different keywords or check for spelling mistakes.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Employees Section */}
            {searchResults.employees.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <User className="mr-2 h-5 w-5" /> 
                  Employees 
                  <Badge variant="secondary" className="ml-2">
                    {searchResults.employees.length}
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.employees.map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      {renderEmployeeCard(employee)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Departments Section */}
            {searchResults.departments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Building2 className="mr-2 h-5 w-5" /> 
                  Departments 
                  <Badge variant="secondary" className="ml-2">
                    {searchResults.departments.length}
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.departments.map((department, index) => (
                    <motion.div
                      key={department.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      {renderDepartmentCard(department)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Documents Section */}
            {searchResults.documents.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <FileText className="mr-2 h-5 w-5" /> 
                  Documents 
                  <Badge variant="secondary" className="ml-2">
                    {searchResults.documents.length}
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.documents.map((document, index) => (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      {renderDocumentCard(document)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsPage;