import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckSquare,
  Receipt,
} from "lucide-react";

const allMenuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    roles: ["admin", "hr", "employee"],
  },
   {
    icon: LayoutDashboard,
    label: "Profile",
    path: "/profile",
    roles: ["hr"],
  },
  {
    icon: Shield,
    label: "Announcements",
    path: "/feeds",
    roles: ["admin", "hr"],
  },
  {
    icon: Building2,
    label: "Organization",
    path: "/organization",
    roles: ["admin", "hr"],
  },
  { icon: Users, label: "Teams", path: "/teams", roles: ["admin", "hr"] },

  {
    icon: UserCheck,
    label: "Employees",
    path: "/employees",
    roles: ["admin", "hr"],
  },
  {
    icon: UserPlus,
    label: "Manage Onboarding",
    path: "/onboarding",
    roles: ["admin", "hr"],
  },
  {
    icon: UserPlus,
    label: "Onboarding",
    path: "/employee-onboarding",
    roles: ["employee", "hr"],
  },
  {
    icon: UserMinus,
    label: "Manage Offboarding",
    path: "/offboarding",
    roles: ["admin", "hr"],
  },
   {
    icon: UserMinus,
    label: "Offboarding",
    path: "/employee-offboarding",
    roles: ["employee", "hr"],
  },
  {
    icon: Calendar,
    label: "Leave",
    path: "/leave",
    roles: ["admin", "hr", "employee"],
  },
    {
    icon: Clock,
    label: "Attendance",
    path: "/attendance",
    roles: ["hr", "employee"],
  },
  {
    icon: Clock,
    label: "Attendance details",
    path: "/attendance-details",
    roles: ["admin", "hr"],
  },
  {
    icon: DollarSign,
    label: "Payroll",
    path: "/payroll",
    roles: ["admin", "hr"],
  },
  {
    icon: Receipt,
    label: "My Payslips",
    path: "/my-payslips",
    roles: ["employee"],
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
    roles: ["admin", "hr"],
  },
  {
    icon: CheckSquare,
    label: "Approvals",
    path: "/approvals",
    roles: ["admin", "hr"],
  },
  {
    icon: FileText,
    label: "HR Letters",
    path: "/hr-letters",
    roles: ["admin", "hr"],
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    roles: ["admin", "hr", "employee"],
  },
  // { icon: Shield, label: 'Audit', path: '/audit', roles: ['admin'] },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = allMenuItems.filter((item) => {
    if (user?.role === "employee") {
      return ![
        "/teams",
        "/profile",
        "/organization",
        "/attendance-details",
        "/employees",
        "/onboarding",
        "/offboarding",
        "/payroll",
        "/reports",
        "/audit",
        "/hr-letters",
        "/feeds",
      ].includes(item.path);
    }
    return item.roles.includes(user?.role);
  });

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-card shadow-xl border-r border-border flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HRMS Pro
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Human Resource Management
              </p>
            </motion.div>
          )}

          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />

              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="ml-3 font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 border-t border-border"
        >
          <div className="text-xs text-muted-foreground text-center">
            <p>© 2025 HRMS Pro</p>
            <p>Version 1.0.0</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Sidebar;
