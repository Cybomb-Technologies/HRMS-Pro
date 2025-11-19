import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  CalendarDays,
  PauseCircle,
  Filter,
  Search,
  Users,
  FileText,
  TrendingDown,
  RotateCcw,
  Download,
  Settings,
  Edit,
  Save,
  X,
} from "lucide-react";

const LeaveSection = () => {
  const { leaveRequests: leaveApi, leaveSettings } = useAppContext();
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveBalances, setLeaveBalances] = useState({});
  const [activeTab, setActiveTab] = useState("requests");
  const [editingSettings, setEditingSettings] = useState(false);
  const [leaveSettingsData, setLeaveSettingsData] = useState({
    annualLeaveLimit: 6,
    sickLeaveLimit: 6,
    personalLeaveLimit: 6,
  });

  // ✅ NEW: Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);

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

  // ✅ NEW: Get current user role and permissions
  useEffect(() => {
    const initializeUserPermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (token) {
          const decoded = decodeJWT(token);
          console.log("🔐 Decoded user data:", decoded);
          
          if (decoded && decoded.role) {
            setCurrentUserRole(decoded.role);
            await fetchUserPermissions(decoded.role);
          } else {
            setCurrentUserRole('employee');
          }
        } else {
          setCurrentUserRole('employee');
        }
      } catch (error) {
        console.error("Error initializing permissions:", error);
        setCurrentUserRole('employee');
      }
    };

    initializeUserPermissions();
  }, []);

  const fetchUserPermissions = async (role) => {
    try {
      console.log("🔍 Fetching permissions for role:", role);
      const res = await fetch('http://localhost:5000/api/settings/roles/roles');
      
      if (res.ok) {
        const data = await res.json();
        console.log("📋 All roles data:", data.data);
        
        const userRoleData = data.data.find(r => r.name === role);
        console.log("🎯 User role data:", userRoleData);
        
        if (userRoleData) {
          const leavePermission = userRoleData.permissions.find(p => p.module === 'Leave-Management');
          console.log("🚀 Leave-Management permission:", leavePermission);
          setUserPermissions(userRoleData.permissions);
        } else {
          console.log("❌ Role not found in database:", role);
          setUserPermissions(getDefaultPermissions(role));
        }
      } else {
        console.log("❌ API failed, using default permissions");
        setUserPermissions(getDefaultPermissions(role));
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setUserPermissions(getDefaultPermissions(role));
    }
  };

  // Fallback permissions if API fails
  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: [{ module: 'Leave-Management', accessLevel: 'crud' }],
      hr: [{ module: 'Leave-Management', accessLevel: 'crud' }],
      employee: [{ module: 'Leave-Management', accessLevel: 'read' }]
    };
    return defaults[role] || [];
  };

  // ✅ UPDATED: Correct Permission check function
  const hasPermission = (action) => {
    // Admin ku full access
    if (currentUserRole === 'admin') return true;
    
    // Find Leave-Management module permission
    const leavePermission = userPermissions.find(p => p.module === 'Leave-Management');
    if (!leavePermission) {
      console.log("❌ No Leave-Management permission found for role:", currentUserRole);
      return false;
    }

    const accessLevel = leavePermission.accessLevel;
    console.log(`🔐 Checking ${action} permission for ${currentUserRole}:`, accessLevel);
    
    // ✅ UPDATED CORRECT LOGIC:
    switch (action) {
      case 'read':
        // Read access for: read, custom, crud
        return ['read', 'custom', 'crud'].includes(accessLevel);
      case 'create':
        // Create access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'update':
        // Update access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'delete':
        // Delete access ONLY for crud (custom la delete illa)
        return accessLevel === 'crud';
      case 'manage_settings':
        // Manage settings access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      default:
        return false;
    }
  };

  // ✅ Check read permission on component load
  useEffect(() => {
    if (currentUserRole && !hasPermission('read')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to view leave management" 
      });
      setLeaveRequests([]);
      setFilteredRequests([]);
    }
  }, [currentUserRole, userPermissions]);

  // Old permission check (keeping for compatibility)
  const canManageLeaves = () => {
    return (
      user?.role === "admin" || user?.role === "hr" || user?.role === "employer"
    );
  };

  // Fetch all employees from Employee collection
  const fetchAllEmployees = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/employees");
      if (response.ok) {
        const employees = await response.json();
        setAllEmployees(employees);
        return employees;
      }
      return [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  };

  // Load leave settings
  const loadLeaveSettings = async () => {
    try {
      const settings = await leaveSettings.get();
      setLeaveSettingsData(settings);
    } catch (error) {
      console.error("Error loading leave settings:", error);
    }
  };

  // Update leave settings
  const handleUpdateLeaveSettings = async () => {
    if (!hasPermission('manage_settings')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to update leave settings",
        variant: "destructive",
      });
      return;
    }

    try {
      await leaveSettings.update(leaveSettingsData);
      setEditingSettings(false);
      // Reload leave balances to reflect new limits
      await fetchLeaveBalances();
      toast({
        title: "Success",
        description: "Leave settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating leave settings:", error);
      toast({
        title: "Error",
        description: "Failed to update leave settings",
        variant: "destructive",
      });
    }
  };

  // Fetch leave balances
  const fetchLeaveBalances = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/leaves/balances");
      if (response.ok) {
        const balances = await response.json();
        setLeaveBalances(balances);
      }
    } catch (error) {
      console.error("Error fetching leave balances:", error);
    }
  };

  // Fetch all leave requests
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const requests = await leaveApi.getAll();
      setLeaveRequests(requests);
      setFilteredRequests(requests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle leave status update
  const handleStatusUpdate = async (leaveId, newStatus) => {
    if (!hasPermission('update')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to update leave requests",
        variant: "destructive",
      });
      return;
    }

    try {
      await leaveApi.update(leaveId, {
        status: newStatus,
        actionBy: user?.name || "Admin",
      });
      await fetchLeaveRequests();
      await fetchLeaveBalances();
      toast({
        title: "Success",
        description: `Leave request ${newStatus} successfully`,
      });
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast({
        title: "Error",
        description: "Failed to update leave status",
        variant: "destructive",
      });
    }
  };

  // Export leave data to Excel
  const handleExportData = () => {
    if (!hasPermission('read')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export leave data",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const headers = [
        "Employee ID",
        "Employee Name",
        "Leave Type",
        "Start Date",
        "End Date",
        "Duration (Days)",
        "Reason",
        "Status",
        "Applied Date",
        "Approved Date",
        "Approved By",
        "Rejected Date",
        "Rejected By",
      ];

      const csvData = leaveRequests.map((request) => [
        request.employeeId || "N/A",
        request.employee || "N/A",
        request.type || "N/A",
        new Date(request.startDate).toLocaleDateString(),
        new Date(request.endDate).toLocaleDateString(),
        request.days || 1,
        `"${(request.reason || "").replace(/"/g, '""')}"`, // Escape quotes for CSV
        request.status || "pending",
        new Date(request.appliedDate || request.createdAt).toLocaleDateString(),
        request.approvedDate
          ? new Date(request.approvedDate).toLocaleDateString()
          : "N/A",
        request.approvedBy || "N/A",
        request.rejectedDate
          ? new Date(request.rejectedDate).toLocaleDateString()
          : "N/A",
        request.rejectedBy || "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n");

      // Create and download CSV file
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leave-requests-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Leave data exported successfully as Excel/CSV",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export leave data",
        variant: "destructive",
      });
    }
  };

  // Filter leave requests
  useEffect(() => {
    let filtered = leaveRequests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.employeeId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [leaveRequests, statusFilter, searchTerm]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      if (hasPermission('read')) {
        await Promise.all([
          fetchLeaveRequests(),
          fetchAllEmployees(),
          fetchLeaveBalances(),
          loadLeaveSettings(),
        ]);
      }
    };
    loadData();
  }, [hasPermission('read')]);

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      cancelled: { variant: "outline", icon: PauseCircle, label: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((req) => req.status === "pending").length,
    approved: leaveRequests.filter((req) => req.status === "approved").length,
    rejected: leaveRequests.filter((req) => req.status === "rejected").length,
  };

  // Reset all leave balances
  const handleResetAllBalances = async () => {
    if (!hasPermission('update')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to reset leave balances",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to reset all leave balances to their maximum limits?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/leaves/reset-balances",
        {
          method: "POST",
        }
      );

      if (response.ok) {
        await fetchLeaveBalances();
        toast({
          title: "Success",
          description: "All leave balances reset successfully",
        });
      } else {
        throw new Error("Failed to reset balances");
      }
    } catch (error) {
      console.error("Error resetting leave balances:", error);
      toast({
        title: "Error",
        description: "Failed to reset leave balances",
        variant: "destructive",
      });
    }
  };

  // Get balance color based on percentage
  const getBalanceColor = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage <= 25) return "text-red-600";
    if (percentage <= 50) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Leave Management
          </h1>
          <p className="text-muted-foreground">
            Manage employee leave requests and balances
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission('read') && (
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          )}
          {hasPermission('update') && (
            <Button onClick={handleResetAllBalances}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Balances
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "requests"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("requests")}
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            Leave Requests ({stats.total})
          </button>
          {hasPermission('read') && (
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "balances"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("balances")}
            >
              <TrendingDown className="h-4 w-4 mr-2 inline" />
              Leave Balances
            </button>
          )}
          {hasPermission('manage_settings') && (
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {activeTab === "requests" && hasPermission('read') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Requests
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Approved
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === "requests" && hasPermission('read') && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee name, ID, type, or reason..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={fetchLeaveRequests}
                disabled={loading}
              >
                <RotateCcw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </Card>

          {/* Leave Requests Table */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Leave Requests</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">
                    Loading leave requests...
                  </p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No leave requests found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Employee</th>
                        <th className="text-left py-3 px-4">Leave Type</th>
                        <th className="text-left py-3 px-4">Dates</th>
                        <th className="text-left py-3 px-4">Duration</th>
                        <th className="text-left py-3 px-4">Reason</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Applied On</th>
                        {hasPermission('update') && (
                          <th className="text-left py-3 px-4">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr
                          key={request._id || request.id}
                          className="border-b"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {request.employee}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.employeeId}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{request.type}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(
                                  request.startDate
                                ).toLocaleDateString()}
                              </span>
                              <span>-</span>
                              <span>
                                {new Date(request.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{request.days} days</td>
                          <td className="py-3 px-4 max-w-xs truncate">
                            {request.reason}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(
                              request.appliedDate || request.createdAt
                            ).toLocaleDateString()}
                          </td>
                          {hasPermission('update') && (
                            <td className="py-3 px-4">
                              {request.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleStatusUpdate(
                                        request._id || request.id,
                                        "approved"
                                      )
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleStatusUpdate(
                                        request._id || request.id,
                                        "rejected"
                                      )
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {request.status !== "pending" && (
                                <span className="text-sm text-muted-foreground">
                                  {request.status}
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Leave Balances Tab */}
      {activeTab === "balances" && hasPermission('read') && (
        <div className="space-y-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Employee Leave Balances
              </h3>
              {Object.keys(leaveBalances).length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No leave balance data available
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Employee</th>
                        <th className="text-left py-3 px-4">Annual Leave</th>
                        <th className="text-left py-3 px-4">Sick Leave</th>
                        <th className="text-left py-3 px-4">Personal Leave</th>
                        <th className="text-left py-3 px-4">Last Reset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(leaveBalances).map((balance) => (
                        <tr key={balance.employeeId} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {balance.employeeName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {balance.employeeId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`text-sm font-medium ${getBalanceColor(
                                  balance.annualLeave,
                                  balance.annualLeaveLimit || 6
                                )}`}
                              >
                                {balance.annualLeave} /{" "}
                                {balance.annualLeaveLimit || 6}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div
                              className={`text-sm font-medium ${getBalanceColor(
                                balance.sickLeave,
                                balance.sickLeaveLimit || 6
                              )}`}
                            >
                              {balance.sickLeave} /{" "}
                              {balance.sickLeaveLimit || 6}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div
                              className={`text-sm font-medium ${getBalanceColor(
                                balance.personalLeave,
                                balance.personalLeaveLimit || 6
                              )}`}
                            >
                              {balance.personalLeave} /{" "}
                              {balance.personalLeaveLimit || 6}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {balance.lastResetDate
                              ? new Date(
                                  balance.lastResetDate
                                ).toLocaleDateString()
                              : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && hasPermission('manage_settings') && (
        <div className="space-y-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Leave Settings</h3>
                {!editingSettings ? (
                  <Button
                    onClick={() => setEditingSettings(true)}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Settings
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateLeaveSettings}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingSettings(false);
                        loadLeaveSettings(); // Reload original settings
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Annual Leave Settings */}
                <div className="space-y-4">
                  <Label htmlFor="annualLeaveLimit">Annual Leave Limit</Label>
                  {editingSettings ? (
                    <Input
                      id="annualLeaveLimit"
                      type="number"
                      min="0"
                      max="365"
                      value={leaveSettingsData.annualLeaveLimit}
                      onChange={(e) =>
                        setLeaveSettingsData({
                          ...leaveSettingsData,
                          annualLeaveLimit: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      {leaveSettingsData.annualLeaveLimit} days
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Maximum annual leave days per employee per year
                  </p>
                </div>

                {/* Sick Leave Settings */}
                <div className="space-y-4">
                  <Label htmlFor="sickLeaveLimit">Sick Leave Limit</Label>
                  {editingSettings ? (
                    <Input
                      id="sickLeaveLimit"
                      type="number"
                      min="0"
                      max="365"
                      value={leaveSettingsData.sickLeaveLimit}
                      onChange={(e) =>
                        setLeaveSettingsData({
                          ...leaveSettingsData,
                          sickLeaveLimit: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      {leaveSettingsData.sickLeaveLimit} days
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Maximum sick leave days per employee per year
                  </p>
                </div>

                {/* Personal Leave Settings */}
                <div className="space-y-4">
                  <Label htmlFor="personalLeaveLimit">
                    Personal Leave Limit
                  </Label>
                  {editingSettings ? (
                    <Input
                      id="personalLeaveLimit"
                      type="number"
                      min="0"
                      max="365"
                      value={leaveSettingsData.personalLeaveLimit}
                      onChange={(e) =>
                        setLeaveSettingsData({
                          ...leaveSettingsData,
                          personalLeaveLimit: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      {leaveSettingsData.personalLeaveLimit} days
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Maximum personal leave days per employee per year
                  </p>
                </div>
              </div>

              {!editingSettings && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      Last updated:{" "}
                      {leaveSettingsData.lastUpdated
                        ? new Date(
                            leaveSettingsData.lastUpdated
                          ).toLocaleDateString()
                        : "Never"}
                    </span>
                    <span>•</span>
                    <span>By: {leaveSettingsData.updatedBy || "System"}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ✅ Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="font-bold mb-2">🔐 Permission Debug</div>
          <div>Role: {currentUserRole}</div>
          <div>Leave Access: {userPermissions.find(p => p.module === 'Leave-Management')?.accessLevel || 'none'}</div>
          <div className="mt-1">
            <div>Read: {hasPermission('read').toString()}</div>
            <div>Create: {hasPermission('create').toString()}</div>
            <div>Edit: {hasPermission('update').toString()}</div>
            <div>Delete: {hasPermission('delete').toString()}</div>
            <div>Settings: {hasPermission('manage_settings').toString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveSection;