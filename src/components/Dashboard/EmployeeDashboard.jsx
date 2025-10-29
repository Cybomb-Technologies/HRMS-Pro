import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  Rss,
  User,
  CheckSquare,
  Calendar,
  Clock,
  Timer,
  FileText,
  Briefcase,
  TrendingUp,
  Users as TeamsIcon,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

// Employee tab components
import EmployeeProfileTab from '@/components/Dashboard/EmployeeTabs/ProfileTab';
import EmployeeTeamsTab from '@/components/Dashboard/EmployeeTabs/TeamsTab';
import EmployeeLeaveTab from '@/components/Dashboard/EmployeeTabs/LeaveTab';
import EmployeeAttendanceTab from '@/components/Dashboard/EmployeeTabs/AttendanceTab';
import EmployeeActivitiesTab from '@/components/Dashboard/EmployeeTabs/ActivitiesTab';
import EmployeeFeedsTab from '@/components/Dashboard/EmployeeTabs/FeedsTab';
import EmployeeApprovalsTab from '@/components/Dashboard/EmployeeTabs/ApprovalsTab';
import EmployeeTimelogsTab from '@/components/Dashboard/EmployeeTabs/TimelogsTab';
import EmployeeTimesheetsTab from '@/components/Dashboard/EmployeeTabs/TimesheetsTab';
import EmployeeFilesTab from '@/components/Dashboard/EmployeeTabs/FilesTab';
import EmployeeHRProcessTab from '@/components/Dashboard/EmployeeTabs/HRProcessTab';
import EmployeeCareerHistoryTab from '@/components/Dashboard/EmployeeTabs/CareerHistoryTab';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownTimerRef = useRef(null);

  const tabs = [
    { id: 'activities', label: 'Activities', icon: Activity, component: EmployeeActivitiesTab },
    { id: 'feeds', label: 'Feeds', icon: Rss, component: EmployeeFeedsTab },
    { id: 'profile', label: 'Profile', icon: User, component: EmployeeProfileTab },
    { id: 'attendance', label: 'Attendance', icon: Clock, component: EmployeeAttendanceTab },
    { id: 'teams', label: 'Teams', icon: TeamsIcon, component: EmployeeTeamsTab },
    { id: 'leave', label: 'Leave', icon: Calendar, component: EmployeeLeaveTab },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, component: EmployeeApprovalsTab },    
    { id: 'timesheets', label: 'Timesheets', icon: Timer, component: EmployeeTimesheetsTab },
    { id: 'timelogs', label: 'Timelogs', icon: Timer, component: EmployeeTimelogsTab },
    { id: 'files', label: 'Files', icon: FileText, component: EmployeeFilesTab },
    // { id: 'hr_process', label: 'HR Process', icon: Briefcase, component: EmployeeHRProcessTab },
    // { id: 'career_history', label: 'Career History', icon: TrendingUp, component: EmployeeCareerHistoryTab },
    
  ];

  // Show first 8 tabs, rest in dropdown
  const maxVisibleTabs = 8;
  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const dropdownTabs = tabs.slice(maxVisibleTabs);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMoreDropdown(false);
        setIsHoveringDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle dropdown hover
  const handleMouseEnter = () => {
    setIsHoveringDropdown(true);
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      if (!isHoveringDropdown) {
        setShowMoreDropdown(false);
      }
      setIsHoveringDropdown(false);
    }, 300); // 300ms delay before closing
  };

  const handleDropdownMouseEnter = () => {
    setIsHoveringDropdown(true);
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    setIsHoveringDropdown(false);
    dropdownTimerRef.current = setTimeout(() => {
      setShowMoreDropdown(false);
    }, 300); // 300ms delay before closing
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
      }
    };
  }, []);

  // Find active tab component
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  // Check if active tab is in dropdown
  const isActiveTabInDropdown = dropdownTabs.some(tab => tab.id === activeTab);

  return (
    <>
      <Helmet>
        <title>My Dashboard - HRMS Pro</title>
        <meta name="description" content="Your personal dashboard for attendance, team updates, and company messages." />
      </Helmet>

      <div className="space-y-6 relative">
        {/* Welcome / Loading */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {user ? (
            <h1 className="text-3xl font-bold text-foreground">Welcome, {user.name}</h1>
          ) : (
            <h1 className="text-3xl font-bold text-foreground">Loading profile…</h1>
          )}
        </motion.div>

        {/* Tabs */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide relative">
                {/* Visible Tabs */}
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
                
                {/* More Dropdown */}
                {dropdownTabs.length > 0 && (
                  <div 
                    className="relative" 
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                      onMouseEnter={() => setShowMoreDropdown(true)}
                      className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        showMoreDropdown || isActiveTabInDropdown
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span>More</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showMoreDropdown && (
                      <div 
                        className="fixed mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[1000] min-w-[180px] py-2"
                        style={{
                          position: 'fixed',
                          zIndex: 1000
                        }}
                        onMouseEnter={handleDropdownMouseEnter}
                        onMouseLeave={handleDropdownMouseLeave}
                      >
                        {dropdownTabs.map(tab => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setShowMoreDropdown(false);
                                setIsHoveringDropdown(false);
                              }}
                              className={`flex items-center space-x-3 w-full px-4 py-2 text-sm text-left transition-colors hover:bg-gray-50 ${
                                activeTab === tab.id
                                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                                  : 'text-gray-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}

        {/* Active Tab Content */}
        {user && ActiveComponent && (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <ActiveComponent />
          </motion.div>
        )}
      </div>
    </>
  );
};

export default EmployeeDashboard;