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
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [requiresTwoFactorSetup, setRequiresTwoFactorSetup] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [twoFactorSetupData, setTwoFactorSetupData] = useState(null);
  
  // Password reset states
  const [passwordResetStep, setPasswordResetStep] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState("");

  // Load user from localStorage on mount and check 2FA status
  useEffect(() => {
    const storedUser = localStorage.getItem("hrms_user");
    const token = localStorage.getItem("hrms_token");
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Check if 2FA verification is still valid
      checkTwoFactorRequirement(token).then(requirement => {
        if (requirement.requiresTwoFactor && !requirement.twoFactorVerified) {
          // 2FA verification required or expired
          setRequiresTwoFactor(true);
          setRequiresTwoFactorSetup(requirement.requiresTwoFactorSetup || false);
          setPendingEmail(userData.email);
        }
      });
    }
    setLoading(false);
  }, []);

  // Check 2FA requirement with server
  const checkTwoFactorRequirement = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/2fa/check-requirement", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        return await res.json();
      }
      return { requiresTwoFactor: true };
    } catch (error) {
      console.error('Error checking 2FA requirement:', error);
      return { requiresTwoFactor: true };
    }
  };

  // Login function
  const login = async (email, password, twoFactorCode = null, setupTwoFactor = false) => {
    try {
      // Clear password reset states on login attempt
      setPasswordResetStep(null);
      setResetToken(null);
      setResetEmail("");
      
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorCode, setupTwoFactor }),
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (!res.ok) {
        if (data.requiresTwoFactorSetup) {
          setRequiresTwoFactorSetup(true);
          setPendingEmail(email);
          setTwoFactorSetupData(data.twoFactorSetup);
          throw new Error(data.message || "Two-factor authentication setup required");
        }
        throw new Error(data.message || "Login failed");
      }

      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setRequiresTwoFactorSetup(data.requiresTwoFactorSetup || false);
        setPendingEmail(email);
        if (data.twoFactorSetup) {
          setTwoFactorSetupData(data.twoFactorSetup);
        }
        return { 
          requiresTwoFactor: true, 
          requiresTwoFactorSetup: data.requiresTwoFactorSetup || false,
          message: data.message || "Two-factor authentication required",
          twoFactorSetup: data.twoFactorSetup
        };
      }

      // Enhanced user data with robust employeeId handling and offboarding info
      const userData = {
        id: data._id || data.id,
        _id: data._id,
        email: data.email,
        role: data.role,
        name: data.name || email.split("@")[0],
        teamId: data.teamId || 1,
        teamIds: data.teamIds || [data.teamId || 1],
        employeeId: data.employeeId || data.empId || data.employeeID || data._id,
        twoFactorEnabled: data.twoFactorEnabled || false,
        twoFactorSetupCompleted: data.twoFactorSetupCompleted || false,
        twoFactorVerified: data.twoFactorVerified || false,
        twoFactorExpiresAt: data.twoFactorExpiresAt || null,
        offboardingInProgress: data.offboardingInProgress || false,
        employeeStatus: data.employeeStatus || 'active',
        adminId: data.adminId || null,
        hrId: data.hrId || null,
        token: data.token,
      };

      const token = data.token;

      if (userData && token) {
        if (userData.role === 'employee' && !userData.employeeId) {
          console.error('No employeeId found for employee role in login response:', data);
          throw new Error('Employee ID not found in login response');
        }

        setUser(userData);
        setRequiresTwoFactor(false);
        setRequiresTwoFactorSetup(false);
        setPendingEmail("");
        setTwoFactorSetupData(null);
        localStorage.setItem("hrms_user", JSON.stringify(userData));
        localStorage.setItem("hrms_token", token);

        console.log('User data after login:', userData);
        console.log('Employee ID:', userData.employeeId);
        console.log('Offboarding status:', userData.offboardingInProgress);
        console.log('2FA Verified until:', userData.twoFactorExpiresAt ? new Date(userData.twoFactorExpiresAt).toLocaleString() : 'Not verified');

        let welcomeMessage = `Successfully logged in as ${userData.role}.`;
        if (userData.offboardingInProgress) {
          welcomeMessage = `Welcome back! Your offboarding process is in progress.`;
        }
        if (userData.twoFactorVerified) {
          welcomeMessage += ` 2FA verified for 3 days.`;
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

  // Verify 2FA setup
  const verifyTwoFactorSetup = async (code, secret) => {
    try {
      if (!pendingEmail) {
        throw new Error("No pending login found");
      }

      const res = await fetch("http://localhost:5000/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: pendingEmail, 
          code: code,
          secret: secret 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Two-factor authentication setup failed");
      }

      if (data.success && data.token && data.user) {
        const userData = {
          id: data.user._id || data.user.id,
          _id: data.user._id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name || data.user.email.split("@")[0],
          teamId: data.user.teamId || 1,
          teamIds: data.user.teamIds || [data.user.teamId || 1],
          employeeId: data.user.employeeId || data.user.empId || data.user.employeeID || data.user._id,
          twoFactorEnabled: data.user.twoFactorEnabled || false,
          twoFactorSetupCompleted: data.user.twoFactorSetupCompleted || false,
          twoFactorVerified: data.twoFactorVerified || false,
          twoFactorExpiresAt: data.twoFactorExpiresAt || null,
          offboardingInProgress: data.user.offboardingInProgress || false,
          employeeStatus: data.user.employeeStatus || 'active',
          adminId: data.user.adminId || null,
          hrId: data.user.hrId || null,
          token: data.token,
        };

        setUser(userData);
        setRequiresTwoFactor(false);
        setRequiresTwoFactorSetup(false);
        setPendingEmail("");
        setTwoFactorSetupData(null);
        localStorage.setItem("hrms_user", JSON.stringify(userData));
        localStorage.setItem("hrms_token", data.token);

        toast({
          title: "2FA Setup Complete",
          description: "Two-factor authentication has been enabled successfully for 3 days",
        });

        return { success: true };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('2FA setup verification error:', error);
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Verify 2FA code for login
  const verifyTwoFactorLogin = async (code) => {
    try {
      if (!pendingEmail) {
        throw new Error("No pending login found");
      }

      const res = await fetch("http://localhost:5000/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresTwoFactorSetup) {
          setRequiresTwoFactorSetup(true);
          throw new Error(data.message || "Two-factor authentication setup required");
        }
        throw new Error(data.message || "Two-factor authentication failed");
      }

      if (data.success && data.token && data.user) {
        const userData = {
          id: data.user._id || data.user.id,
          _id: data.user._id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name || data.user.email.split("@")[0],
          teamId: data.user.teamId || 1,
          teamIds: data.user.teamIds || [data.user.teamId || 1],
          employeeId: data.user.employeeId || data.user.empId || data.user.employeeID || data.user._id,
          twoFactorEnabled: data.user.twoFactorEnabled || false,
          twoFactorSetupCompleted: data.user.twoFactorSetupCompleted || false,
          twoFactorVerified: data.twoFactorVerified || false,
          twoFactorExpiresAt: data.twoFactorExpiresAt || null,
          offboardingInProgress: data.user.offboardingInProgress || false,
          employeeStatus: data.user.employeeStatus || 'active',
          adminId: data.user.adminId || null,
          hrId: data.user.hrId || null,
          token: data.token,
        };

        setUser(userData);
        setRequiresTwoFactor(false);
        setRequiresTwoFactorSetup(false);
        setPendingEmail("");
        setTwoFactorSetupData(null);
        localStorage.setItem("hrms_user", JSON.stringify(userData));
        localStorage.setItem("hrms_token", data.token);

        toast({
          title: "Login successful",
          description: "Two-factor authentication verified successfully for 3 days",
        });

        return { success: true };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Check if 2FA is currently required
  const isTwoFactorRequiredNow = () => {
    if (!user?.twoFactorEnabled || !user?.twoFactorSetupCompleted) {
      return false;
    }

    // Check if 2FA verification is still valid
    if (user.twoFactorVerified && user.twoFactorExpiresAt) {
      const now = Date.now();
      if (now < user.twoFactorExpiresAt) {
        return false; // 2FA verification is still valid
      }
    }

    return true; // 2FA verification required or expired
  };

  // Get remaining 2FA verification time
  const getRemainingTwoFactorTime = () => {
    if (!user?.twoFactorExpiresAt) {
      return 0;
    }

    const now = Date.now();
    const remaining = user.twoFactorExpiresAt - now;
    return Math.max(0, remaining);
  };

  // Format remaining time for display
  const getFormattedRemainingTime = () => {
    const remaining = getRemainingTwoFactorTime();
    if (remaining === 0) return '';

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  // Setup 2FA login
  const setupTwoFactorLogin = async (code, email, password) => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required for 2FA setup");
      }

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email, 
          password: password,
          twoFactorCode: code,
          setupTwoFactor: true 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Two-factor authentication setup failed");
      }

      if (data.token && data.user) {
        const userData = {
          id: data.user._id || data.user.id,
          _id: data.user._id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name || data.user.email.split("@")[0],
          teamId: data.user.teamId || 1,
          teamIds: data.user.teamIds || [data.user.teamId || 1],
          employeeId: data.user.employeeId || data.user.empId || data.user.employeeID || data.user._id,
          twoFactorEnabled: data.user.twoFactorEnabled || false,
          twoFactorSetupCompleted: data.user.twoFactorSetupCompleted || false,
          offboardingInProgress: data.user.offboardingInProgress || false,
          employeeStatus: data.user.employeeStatus || 'active',
          adminId: data.user.adminId || null,
          hrId: data.user.hrId || null,
          token: data.token,
        };

        setUser(userData);
        setRequiresTwoFactor(false);
        setRequiresTwoFactorSetup(false);
        setPendingEmail("");
        setTwoFactorSetupData(null);
        localStorage.setItem("hrms_user", JSON.stringify(userData));
        localStorage.setItem("hrms_token", data.token);

        toast({
          title: "2FA Setup Complete",
          description: "Two-factor authentication has been enabled successfully",
        });

        return { success: true };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Enhanced Password Reset Functions
  const initiatePasswordReset = async (email) => {
    try {
      setResetEmail(email);
      
      const res = await fetch("http://localhost:5000/api/auth/password/reset/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Reset initiated",
          description: "If the email exists, a reset process has been started",
        });
        
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
        
        if (data.requiresTwoFactor) {
          setPasswordResetStep('2fa_required'); 
        } else {
          setPasswordResetStep('reset_password');
        }
        
        return { 
          success: true, 
          requiresTwoFactor: data.requiresTwoFactor,
          resetToken: data.resetToken,
          message: data.message 
        };
      } else {
        throw new Error(data.message || "Failed to initiate password reset");
      }
    } catch (error) {
      console.error('Password reset initiation error:', error);
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const verifyTwoFactorForReset = async (twoFactorCode) => {
    try {
      if (!resetEmail) {
        throw new Error("No reset process found");
      }

      if (!resetToken) {
        throw new Error("Missing reset token for 2FA verification");
      }
      
      const res = await fetch("http://localhost:5000/api/auth/password/reset/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: resetEmail, 
          twoFactorCode,
          resetToken: resetToken
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setPasswordResetStep('reset_password');
        
        toast({
          title: "2FA Verified",
          description: "Two-factor authentication verified successfully",
        });
        
        return { 
          success: true, 
          resetToken: data.resetToken,
          message: data.message 
        };
      } else {
        throw new Error(data.message || "Two-factor authentication verification failed");
      }
    } catch (error) {
      console.error('2FA verification for reset error:', error);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Enhanced changePassword function
  const changePassword = async (currentPassword, newPassword, twoFactorCode = null) => {
    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) {
        return { error: 'Not authenticated' };
      }

      const response = await fetch("http://localhost:5000/api/auth/change-password", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          twoFactorCode
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully",
        });
        return { success: true };
      } else if (data.requiresTwoFactor) {
        // Set 2FA required state
        setRequiresTwoFactor(true);
        setPendingEmail(user?.email || '');
        return { requiresTwoFactor: true };
      } else {
        return { error: data.message || 'Failed to change password' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { error: 'Failed to change password. Please try again.' };
    }
  };

  // In AuthContext.jsx - update the resetPassword function
  const resetPassword = async (newPassword, twoFactorCode = null, frontendResetToken = null) => {
    try {
      if (!resetEmail) {
        throw new Error("No reset process found");
      }
      
      const tokenToUse = frontendResetToken || resetToken;

      if (!tokenToUse) {
        throw new Error("Missing secure reset token");
      }

      const payload = { 
        email: resetEmail, 
        newPassword, 
        twoFactorCode,
        resetToken: tokenToUse
      };

      const res = await fetch("http://localhost:5000/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordResetStep(null);
        setResetToken(null);
        setResetEmail("");
        
        toast({
          title: "Password Reset",
          description: "Your password has been reset successfully",
        });
        
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || "Password reset failed");
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // Cancel password reset process
  const cancelPasswordReset = () => {
    setPasswordResetStep(null);
    setResetToken(null);
    setResetEmail("");
  };

  // Cancel 2FA process
  const cancelTwoFactor = () => {
    setRequiresTwoFactor(false);
    setRequiresTwoFactorSetup(false);
    setPendingEmail("");
    setTwoFactorSetupData(null);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setOriginalUser(null);
    setRequiresTwoFactor(false);
    setRequiresTwoFactorSetup(false);
    setPendingEmail("");
    setTwoFactorSetupData(null);
    setPasswordResetStep(null);
    setResetToken(null);
    setResetEmail("");
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

  // Refresh user data
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
    // 2FA related values
    requiresTwoFactor,
    requiresTwoFactorSetup,
    pendingEmail,
    twoFactorSetupData,
    verifyTwoFactorLogin,
    setupTwoFactorLogin,
    cancelTwoFactor,
    verifyTwoFactorSetup,
    // 2FA expiry functions
    isTwoFactorRequiredNow,
    getRemainingTwoFactorTime,
    getFormattedRemainingTime,
    // Password reset functions and states
    initiatePasswordReset,
    verifyTwoFactorForReset,
    resetPassword,
    cancelPasswordReset,
    passwordResetStep,
    resetToken,
    resetEmail,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};