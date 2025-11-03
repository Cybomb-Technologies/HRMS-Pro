// components/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Settings, 
  Shield, 
  Database, 
  BarChart3, 
  Clock,
  FileText,
  Building,
  CreditCard,
  Bell,
  Mail,
  Calendar,
  Download,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin // New icon for Locations
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEmployees: 0,
    pendingOnboarding: 0,
    pendingOffboarding: 0,
    totalDepartments: 0,
    totalTeams: 0,
    payrollProcessed: 0,
    thisMonthPayroll: 0,
    totalLocations: 0, // Changed from activeSessions to totalLocations
    storageUsed: '0GB'
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all data from the new dashboard endpoints
      const [statsData, activityData, statusData] = await Promise.all([
        fetch('http://localhost:5000/api/admin/dashboard/stats').then(res => res.json()),
        fetch('http://localhost:5000/api/admin/dashboard/recent-activity').then(res => res.json()),
        fetch('http://localhost:5000/api/admin/dashboard/system-status').then(res => res.json())
      ]);

      console.log('Fetched dashboard data:', {
        stats: statsData,
        activity: activityData?.length || 0,
        status: statusData
      });

      // Set stats data
      if (statsData && !statsData.message) {
        setStats({
          totalUsers: statsData.totalUsers || 0,
          activeEmployees: statsData.activeEmployees || 0,
          pendingOnboarding: statsData.pendingOnboarding || 0,
          pendingOffboarding: statsData.pendingOffboarding || 0,
          totalDepartments: statsData.totalDepartments || 0,
          totalTeams: statsData.totalTeams || 0,
          payrollProcessed: statsData.payrollProcessed || 0,
          thisMonthPayroll: statsData.thisMonthPayroll || 0,
          totalLocations: statsData.totalLocations || 0, // Fetches new stat
          storageUsed: statsData.storageUsed || '0GB'
        });
      }

      // Set recent activity
      if (Array.isArray(activityData)) {
        setRecentActivity(activityData.slice(0, 6));
      }

      // Set system status
      if (statusData && !statusData.message) {
        setSystemStatus(statusData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
      red: { bg: 'bg-red-50', text: 'text-red-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600' }
    };

    const colorClass = colorClasses[color] || colorClasses.blue;

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClass.bg} ml-4`}>
            <Icon className={`h-6 w-6 ${colorClass.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const StatusIndicator = ({ status, label }) => {
    const getStatusInfo = (status) => {
      switch (status) {
        case 'operational':
        case 'connected':
          return { color: 'green', icon: CheckCircle2 };
        case 'degraded':
          return { color: 'yellow', icon: AlertCircle };
        default:
          return { color: 'red', icon: XCircle };
      }
    };

    const { color, icon: StatusIcon } = getStatusInfo(status);
    const colorClasses = {
      green: { bg: 'bg-green-100', text: 'text-green-800' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      red: { bg: 'bg-red-100', text: 'text-red-800' }
    };

    const colorClass = colorClasses[color] || colorClasses.green;

    return (
      <div className="flex justify-between items-center py-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium ${colorClass.bg} ${colorClass.text} rounded-full capitalize`}>
            {status}
          </span>
          <StatusIcon className={`h-4 w-4 text-${color}-600`} />
        </div>
      </div>
    );
  };

const QuickAction = ({ title, description, icon: Icon, to, color = 'blue' }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'bg-green-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'bg-indigo-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'bg-purple-100' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'bg-gray-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', hover: 'bg-teal-100' }
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <Link 
      to={to}
      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all group block"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClass.bg} group-hover:${colorClass.hover} transition-colors`}>
          <Icon className={`h-5 w-5 ${colorClass.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 truncate">{title}</h4>
          <p className="text-sm text-gray-600 mt-1 truncate">{description}</p>
        </div>
      </div>
    </Link>
  );
};


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}. Real-time system overview.
            {error && (
              <span className="text-orange-600 text-sm ml-2">
                (Partial data loaded - {error})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-400 mr-2" />
            <p className="text-orange-800">{error}</p>
          </div>
        </div>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalUsers}
          subtitle="All employees in system"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          subtitle="Currently employed"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Pending Onboarding"
          value={stats.pendingOnboarding}
          subtitle="New hires to process"
          icon={Mail}
          color="orange"
        />
        <StatCard
          title="Pending Offboarding"
          value={stats.pendingOffboarding}
          subtitle="Exits to process"
          icon={Users}
          color="red"
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          subtitle="Organizational units"
          icon={Building}
          color="purple"
        />
        <StatCard
          title="Teams"
          value={stats.totalTeams}
          subtitle="Active project teams"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Payroll Processed"
          value={`$${stats.payrollProcessed.toLocaleString()}`}
          subtitle="Total amount processed"
          icon={CreditCard}
          color="green"
        />
        {/* Replaced Active Sessions with Locations */}
        <StatCard
          title="Locations"
          value={stats.totalLocations}
          subtitle="Operational offices"
          icon={MapPin} // Changed icon to MapPin
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-gray-600 text-sm mt-1">Frequently used administrative tasks</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/employees">
               <QuickAction
                title="Employee Management"
                description="Add, edit, or remove employees"
                icon={Users}
                to="/employees"
                color="blue"
              />
              </Link>
             
              <QuickAction
                title="Payroll Processing"
                description="Run and manage payroll"
                icon={CreditCard}
                to="/payroll"
                color="green"
              />
              <QuickAction
                title="Attendance Management"
                description="View and manage attendance"
                icon={Clock}
                to="/attendance"
                color="indigo"
              />
              <QuickAction
                title="Organization Structure"
                description="Manage departments and teams"
                icon={Building}
                to="/organization"
                color="purple"
              />
              <QuickAction
                title="System Settings"
                description="Configure system preferences"
                icon={Settings}
                to="/settings"
                color="gray"
              />
              <QuickAction
                title="Reports & Analytics"
                description="View system reports"
                icon={BarChart3}
                to="/reports"
                color="teal"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Recent System Activity</h3>
              <p className="text-gray-600 text-sm mt-1">Latest actions and events</p>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message || activity.title || `Activity ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recent'} • {activity.user || 'System'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity to display</p>
                  <p className="text-sm text-gray-400 mt-1">System events will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - System Status */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">System Status</h3>
              <p className="text-gray-600 text-sm mt-1">Current system health</p>
            </div>
            <div className="p-6 space-y-2">
              <StatusIndicator status={systemStatus.api} label="API Status" />
              <StatusIndicator status={systemStatus.database} label="Database" />
              <StatusIndicator status={systemStatus.authentication} label="Authentication" />
              <StatusIndicator status={systemStatus.storage} label="File Storage" />
            </div>
          </div>

          {/* Storage Usage */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Storage Usage</h3>
              <p className="text-gray-600 text-sm mt-1">System storage allocation</p>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Used</span>
                <span className="text-sm font-medium text-gray-900">{stats.storageUsed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    // Note: This calculation assumes 50GB max, adjust the value you divide by if needed.
                    width: `${(parseFloat(stats.storageUsed) / 50) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">0GB</span>
                <span className="text-xs text-gray-500">50GB total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;