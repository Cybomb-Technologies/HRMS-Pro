import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  UserPlus,
  DollarSign,
  Gift,
  MessageSquare,
  CheckSquare,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    employees: [],
    onboardingCandidates: [],
    companyMessages: [],
    payrollCost: 0,
    loading: true,
    hrEmployees: [],
    errors: {},
    stats: {
      totalEmployees: 0,
      activeOnboarding: 0,
      monthlyPayroll: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Response is not JSON');
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, errors: {} }));

      const endpoints = [
        { key: 'employees', url: 'http://localhost:5000/api/employees' },
        { key: 'onboarding', url: 'http://localhost:5000/api/onboarding' },
        { key: 'messages', url: 'http://localhost:5000/api/announcements' },
        { key: 'payroll', url: 'http://localhost:5000/api/payroll/last-run' },
        { key: 'stats', url: 'http://localhost:5000/api/dashboard/stats' }
      ];

      const results = await Promise.allSettled(
        endpoints.map(endpoint => apiCall(endpoint.url))
      );

      // Process results
      const employeesData = results[0];
      const onboardingData = results[1];
      const messagesData = results[2];
      const payrollData = results[3];
      const statsData = results[4];

      // Process employees data
      let employees = [];
      if (employeesData.status === 'fulfilled' && employeesData.value) {
        employees = Array.isArray(employeesData.value) 
          ? employeesData.value 
          : (employeesData.value.employees || employeesData.value.data || []);
      }

      // Process onboarding data
      let onboardingCandidates = [];
      if (onboardingData.status === 'fulfilled' && onboardingData.value) {
        onboardingCandidates = Array.isArray(onboardingData.value)
          ? onboardingData.value
          : (onboardingData.value.candidates || onboardingData.value.data || []);
      }

      // Process company messages
      let companyMessages = [];
      if (messagesData.status === 'fulfilled' && messagesData.value) {
        companyMessages = Array.isArray(messagesData.value)
          ? messagesData.value
          : (messagesData.value.announcements || messagesData.value.messages || messagesData.value.data || []);
      }

      // Process payroll data
      let payrollCost = 0;
      if (payrollData.status === 'fulfilled' && payrollData.value) {
        if (payrollData.value.payrollRecords && Array.isArray(payrollData.value.payrollRecords)) {
          payrollCost = payrollData.value.payrollRecords.reduce((total, record) => total + (record.netSalary || 0), 0);
        } else {
          payrollCost = payrollData.value.totalAmount || payrollData.value.netSalary || 0;
        }
      }

      // Process dashboard stats
      let stats = {
        totalEmployees: employees.length,
        activeOnboarding: onboardingCandidates.length,
        monthlyPayroll: payrollCost
      };
      
      if (statsData.status === 'fulfilled' && statsData.value) {
        stats = {
          totalEmployees: statsData.value.totalEmployees || statsData.value.totalUsers || employees.length,
          activeOnboarding: statsData.value.pendingOnboarding || statsData.value.activeOnboarding || onboardingCandidates.length,
          monthlyPayroll: statsData.value.thisMonthPayroll || statsData.value.monthlyPayroll || payrollCost
        };
      }

      // Filter HR employees
      const hrEmployees = employees.filter(emp => 
        emp.department?.toLowerCase() === 'hr' || 
        emp.role?.toLowerCase().includes('hr') ||
        emp.position?.toLowerCase().includes('human resources')
      );

      // Collect errors
      const errors = {};
      endpoints.forEach((endpoint, index) => {
        if (results[index].status === 'rejected') {
          errors[endpoint.key] = results[index].reason.message;
        }
      });

      setDashboardData({
        employees,
        onboardingCandidates,
        companyMessages,
        payrollCost,
        hrEmployees,
        stats,
        loading: false,
        errors
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ 
        ...prev, 
        loading: false, 
        errors: { general: error.message } 
      }));
    }
  };

  const today = new Date();
  const birthdayFolks = dashboardData.employees.filter(emp => {
    if (!emp.dob) return false;
    try {
      const birthDate = new Date(emp.dob);
      return birthDate.getDate() === today.getDate() && 
             birthDate.getMonth() === today.getMonth();
    } catch {
      return false;
    }
  });

  const stats = [
    { 
      id: 1,
      title: 'Total Employees', 
      value: dashboardData.stats.totalEmployees, 
      icon: Users, 
      path: '/employees',
      error: dashboardData.errors.employees
    },
    { 
      id: 2,
      title: 'Onboarding', 
      value: dashboardData.stats.activeOnboarding, 
      icon: UserPlus, 
      path: '/onboarding',
      error: dashboardData.errors.onboarding
    },
    { 
      id: 3,
      title: `Payroll Cost (${new Date().toLocaleString('default', { month: 'long' })})`, 
      value: dashboardData.stats.monthlyPayroll, 
      icon: DollarSign, 
      path: '/payroll',
      error: dashboardData.errors.payroll
    },
  ];

  const quickActions = [
    { id: 1, title: 'Add Employee', icon: UserPlus, path: '/employees' },
    { id: 2, title: 'Start Onboarding', icon: UserPlus, path: '/onboarding' },
    { id: 3, title: 'Leave', icon: Calendar, path: '/leave' },
    { id: 4, title: 'Run Payroll', icon: DollarSign, path: '/payroll' },
    { id: 5, title: 'Generate Letter', icon: FileText, path: '/hr-letters' },
    { id: 6, title: 'Create Team', icon: Users, path: '/teams' },
    { id: 7, title: 'Post Message', icon: MessageSquare, path: '/feeds' },
    { id: 8, title: 'Review Approvals', icon: CheckSquare, path: '/approvals' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const hasErrors = Object.keys(dashboardData.errors).length > 0;

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Employer Dashboard - HRMS Pro</title>
        <meta name="description" content="High-level overview of the organization for employers." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold text-foreground">Employer Dashboard</h1>
            <p className="text-muted-foreground mt-2">A high-level overview of your organization.</p>
          </motion.div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const hasError = !!stat.error;
            
            return (
              <Card 
                key={stat.id}
                className={`p-6 card-hover cursor-pointer ${hasError ? 'border-yellow-200 bg-yellow-50' : ''}`} 
                onClick={() => navigate(stat.path)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stat.title.includes('Payroll') ? formatCurrency(stat.value) : stat.value}
                    </p>
                    {hasError && (
                      <p className="text-xs text-yellow-600 mt-1">Data may be outdated</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${hasError ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button 
                  key={action.id}
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-lg" 
                  onClick={() => navigate(action.path)}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Messages */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" /> 
                  Company Messages
                </h3>
                {dashboardData.errors.messages && (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {dashboardData.companyMessages.length > 0 ? (
                  dashboardData.companyMessages.map((msg, index) => (
                    <div key={msg.id || msg._id || `msg-${index}`} className="p-3 border rounded-lg">
                      <h4 className="font-semibold">{msg.title || 'No Title'}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {msg.content || msg.message || 'No content available'}
                      </p>
                      {msg.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {dashboardData.errors.messages ? 'Unable to load messages' : 'No company messages available.'}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Sidebar - Birthdays and HR Team */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="space-y-8">
            {/* Today's Birthdays */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Gift className="mr-2 h-5 w-5 text-primary" /> 
                Today's Birthdays
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {birthdayFolks.length > 0 ? (
                  birthdayFolks.map(emp => (
                    <div key={emp.id || `emp-${emp.email}`} className="flex items-center space-x-3 p-2 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.department || 'No Department'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {dashboardData.errors.employees ? 'Unable to load birthdays' : 'No birthdays today.'}
                  </p>
                )}
              </div>
            </Card>
            
            {/* HR Team */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" /> 
                HR Team
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {dashboardData.hrEmployees.length > 0 ? (
                  dashboardData.hrEmployees.map(hrEmp => (
                    <div key={hrEmp.id || `hr-${hrEmp.email}`} className="flex items-center space-x-3 p-2 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{hrEmp.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {hrEmp.position || hrEmp.role || 'HR Team Member'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {dashboardData.errors.employees ? 'Unable to load HR team' : 'No HR team members found.'}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default EmployerDashboard;