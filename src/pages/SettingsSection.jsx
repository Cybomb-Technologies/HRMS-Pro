// components/settings/SettingsSection.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Users,
  Shield,
  Bell,
  Globe,
  DollarSign,
  UserPlus,
  FileText,
  ListChecks,
  UserCircle
} from 'lucide-react';

// Import section components
import GeneralSettings from '../components/settings/GeneralSettings';
import RolesPermissions from '../components/settings/RolesPermissions';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import LocalizationSettings from '../components/settings/LocalizationSettings';
import PayrollSettings from '../components/settings/PayrollSettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import SimpleSettings from '../components/settings/SimpleSettings';
import { SettingsProvider } from '../contexts/SettingsContext';

const SettingsSection = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'employee' ? 'profile' : 'general');

  const adminSettingsTabs = [
    { id: 'general', label: 'General', icon: Building2, component: GeneralSettings },
    { id: 'roles', label: 'Roles & Permissions', icon: Users, component: RolesPermissions },
    { id: 'security', label: 'Security', icon: Shield, component: SecuritySettings },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSettings },
    { id: 'localization', label: 'Localization', icon: Globe, component: LocalizationSettings },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, component: PayrollSettings },
    // { id: 'onboarding', label: 'Onboarding', icon: UserPlus, component: () => <SimpleSettings title="Onboarding" description="Configure employee onboarding workflows and templates" /> },
    // { id: 'hr-letters', label: 'HR Letters', icon: FileText, component: () => <SimpleSettings title="HR Letters" description="Manage HR letter templates and document generation" /> },
    // { id: 'tasks', label: 'Tasks/Checklists', icon: ListChecks, component: () => <SimpleSettings title="Tasks/Checklists" description="Configure task templates and checklist workflows" /> },
  ];

  const employeeSettingsTabs = [
    { id: 'profile', label: 'My Profile', icon: UserCircle, component: ProfileSettings },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSettings },
  ];

  const settingsTabs = user?.role === 'employee' ? employeeSettingsTabs : adminSettingsTabs;
  const ActiveComponent = settingsTabs.find(tab => tab.id === activeTab)?.component;

  return (
    <SettingsProvider>
      <Helmet>
        <title>Settings - HRMS Pro</title>
        <meta name="description" content="Configure company settings, roles, security, and more in HRMS Pro" />
      </Helmet>
      
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's settings and preferences
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="lg:col-span-1"
          >
            <Card className="p-4 sticky top-6">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id 
                          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </motion.div>
          
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }} 
            className="lg:col-span-3"
          >
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        </div>
      </div>
    </SettingsProvider>
  );
};

export default SettingsSection;