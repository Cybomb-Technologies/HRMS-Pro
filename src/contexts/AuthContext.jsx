import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("hrms_user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // Enhanced login function with offboarding support
  const login = async (email, password) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      console.log('Login response data:', data); // Debug log

      // Enhanced user data with robust employeeId handling and offboarding info
      const userData = {
        id: data._id || data.id,
        _id: data._id,
        email: data.email,
        role: data.role,
        name: data.name || email.split("@")[0],
        teamId: data.teamId || 1,
        teamIds: data.teamIds || [data.teamId || 1],
        // CRITICAL FIX: Multiple fallbacks for employeeId
        employeeId: data.employeeId || data.empId || data.employeeID || data._id,
        // Offboarding information
        offboardingInProgress: data.offboardingInProgress || false,
        employeeStatus: data.employeeStatus || 'active',
        // Additional fields for better permission handling
        adminId: data.adminId || null,
        hrId: data.hrId || null,
      };

      const token = data.token;

      if (userData && token) {
        // Validate that we have an employeeId for employee roles
        if (userData.role === 'employee' && !userData.employeeId) {
          console.error('No employeeId found for employee role in login response:', data);
          throw new Error('Employee ID not found in login response');
        }

        setUser(userData);
        localStorage.setItem("hrms_user", JSON.stringify(userData));
        localStorage.setItem("hrms_token", token);

        console.log('User data after login:', userData);
        console.log('Employee ID:', userData.employeeId);
        console.log('Offboarding status:', userData.offboardingInProgress);

        // Custom welcome message based on offboarding status
        let welcomeMessage = `Successfully logged in as ${userData.role}.`;
        if (userData.offboardingInProgress) {
          welcomeMessage = `Welcome back! Your offboarding process is in progress.`;
        }

        toast({
          title: userData.offboardingInProgress ? "Offboarding in Progress" : "Welcome back!",
          description: welcomeMessage,
        });

        return { success: true };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setOriginalUser(null);
    localStorage.removeItem("hrms_user");
    localStorage.removeItem("hrms_token");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // Enhanced permission check with offboarding support
  const can = (action, resource = null) => {
    if (!user) return false;

    // Check if user is in offboarding process and restrict certain actions
    if (user.offboardingInProgress) {
      const allowedDuringOffboarding = [
        "view:employee_details",
        "edit:employee_basic",
        "create:leave",
        "cancel:own_leave",
        "view:offboarding",
        "upload:offboarding_documents",
        "complete:offboarding_steps"
      ];
      
      if (!allowedDuringOffboarding.includes(action)) {
        return false;
      }
    }

    // Check if user has explicit permission
    if (user.permissions && user.permissions.includes(action)) {
      return true;
    }

    // Role-based fallback permissions
    const { role, employeeId } = user;

    switch (action) {
      case "view:employee_list":
      case "create:employee":
      case "delete:employee":
      case "view:all_attendance":
      case "approve:timesheet":
      case "approve:manual_attendance":
      case "approve:leave":
      case "reject:leave":
      case "manage:offboarding":
      case "view:all_offboarding":
      case "start:offboarding":
      case "complete:offboarding":
        return ["hr", "employer"].includes(role);

      case "view:employee_details":
        if (["hr", "employer"].includes(role)) return true;
        if (resource?.id === employeeId) return true;
        if (resource?.employeeId === employeeId) return true;
        return false;

      case "edit:employee_core":
        return ["hr", "employer"].includes(role);

      case "edit:employee_basic":
        return (
          resource?.id === employeeId || 
          resource?.employeeId === employeeId || 
          ["hr", "employer"].includes(role)
        );

      case "create:leave":
      case "cancel:own_leave":
        return true; // All authenticated users can apply for leave

      // Offboarding permissions
      case "view:offboarding":
        if (["hr", "employer"].includes(role)) return true;
        if (resource?.employeeId === employeeId) return true;
        return false;

      case "upload:offboarding_documents":
      case "complete:offboarding_steps":
        if (["hr", "employer"].includes(role)) return true;
        if (resource?.employeeId === employeeId) return true;
        return false;

      case "manage:assets":
        return ["hr", "employer", "it_admin"].includes(role);

      default:
        return false;
    }
  };

  // Check if user can manage leaves (approve/reject)
  const canManageLeaves = () => {
    return can("approve:leave") || can("reject:leave");
  };

  // Check if user can manage offboarding
  const canManageOffboarding = () => {
    return can("manage:offboarding") || can("view:all_offboarding");
  };

  // Check if user is in offboarding process
  const isInOffboarding = () => {
    return user?.offboardingInProgress === true;
  };

  // Check if user can access offboarding features
  const canAccessOffboarding = (employeeId = null) => {
    if (!user) return false;
    
    // HR and employers can access all offboarding
    if (["hr", "employer"].includes(user.role)) return true;
    
    // Employees can only access their own offboarding
    if (user.role === "employee") {
      if (!employeeId) return user.offboardingInProgress;
      return employeeId === user.employeeId;
    }
    
    return false;
  };

  // Impersonate role
  const impersonate = async (role) => {
    if (user.role !== "employer") {
      toast({
        title: "Permission Denied",
        description: "Only employers can impersonate roles.",
        variant: "destructive",
      });
      return;
    }
    if (!originalUser) setOriginalUser(user);

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/impersonate/${role}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to impersonate");

      const targetUser = data.user;
      if (targetUser) {
        setUser(targetUser);
        toast({
          title: "Impersonation Started",
          description: `You are now acting as ${role}.`,
        });
      }
    } catch (err) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Stop impersonation
  const stopImpersonating = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      toast({
        title: "Impersonation Stopped",
        description: "You are back to your original role.",
      });
    }
  };

// In AuthContext.jsx - update the refreshUser function
const refreshUser = async () => {
  try {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;

    const res = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const userData = await res.json();
      const enhancedUserData = {
        ...userData,
        // Ensure all required fields are present
        id: userData._id || userData.id,
        employeeId: userData.employeeId || userData.empId || userData._id,
        name: userData.name || userData.email?.split("@")[0],
        teamId: userData.teamId || 1,
        teamIds: userData.teamIds || [userData.teamId || 1],
      };
      
      setUser(enhancedUserData);
      localStorage.setItem("hrms_user", JSON.stringify(enhancedUserData));
    }
  } catch (error) {
    console.error("Failed to refresh user data:", error);
  }
};

  // Get user display status (considers offboarding)
  const getUserStatus = () => {
    if (!user) return "Unknown";
    
    if (user.offboardingInProgress) {
      return "Offboarding";
    }
    
    return user.employeeStatus || "Active";
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    impersonate,
    stopImpersonating,
    isImpersonating: !!originalUser,
    can,
    canManageLeaves,
    canManageOffboarding,
    isInOffboarding,
    canAccessOffboarding,
    refreshUser,
    getUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};