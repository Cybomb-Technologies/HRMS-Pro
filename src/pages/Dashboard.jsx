import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeDashboard from '@/components/Dashboard/EmployeeDashboard';
import HRDashboard from '@/components/Dashboard/HRDashboard';
import EmployerDashboard from '@/components/Dashboard/EmployerDashboard';
import AdminDashboard from '@/components/Dashboard/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'employer':
        return <EmployerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div className="text-center p-8">Loading dashboard...</div>;
    }
  };

  return <>{renderDashboardByRole()}</>;
};

export default Dashboard;