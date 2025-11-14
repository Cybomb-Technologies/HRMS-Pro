import React, { createContext, useContext, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

const API_BASE_URL = "http://localhost:5000/api";

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useLocalStorage("hrms_audit_logs", []);
  const [employees, setEmployees] = useLocalStorage("hrms_employees", []);
  const [teams, setTeams] = useLocalStorage("hrms_teams", []);
  const [departments, setDepartments] = useLocalStorage("hrms_departments", []);
  const [designations, setDesignations] = useLocalStorage(
    "hrms_designations",
    []
  );
  const [locations, setLocations] = useLocalStorage("hrms_locations", []);
  const [companyMessages, setCompanyMessages] = useLocalStorage(
    "hrms_company_messages",
    []
  );
  const [onboarding, setOnboarding] = useLocalStorage("hrms_onboarding", []);
  const [offboarding, setOffboarding] = useLocalStorage("hrms_offboarding", []);
  const [roles, setRoles] = useLocalStorage("hrms_roles", []);
  const [shifts, setShifts] = useLocalStorage("hrms_shifts", []);
  const [companySettings, setCompanySettings] = useLocalStorage(
    "hrms_company_settings",
    {}
  );
  const [leaveRequests, setLeaveRequests] = useLocalStorage(
    "hrms_leave_requests",
    []
  );
  const [notifications, setNotifications] = useLocalStorage(
    "hrms_notifications",
    []
  );
  const [policies, setPolicies] = useLocalStorage("hrms_policies", []);
  const [companyHolidays, setCompanyHolidays] = useLocalStorage(
    "hrms_company_holidays",
    []
  );
  const [hrRequests, setHrRequests] = useLocalStorage("hrms_hr_requests", []);
  const [leaveSettings, setLeaveSettings] = useLocalStorage(
    "hrms_leave_settings",
    {
      annualLeaveLimit: 6,
      sickLeaveLimit: 6,
      personalLeaveLimit: 6,
    }
  );

  const logAction = (action, details = {}, before = null, after = null) => {
    const newLog = {
      id: uuidv4(),
      user: user?.name || "System",
      role: user?.role || "system",
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      status: "success",
      before,
      after,
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  // ✅ ENHANCED: Real notification API functions with proper error handling and debug logging
  const notificationApi = {
    get: async (employeeId) => {
      try {
        console.log(
          "🔔 [DEBUG] Fetching notifications for employee:",
          employeeId
        );

        if (!employeeId) {
          console.error("❌ [DEBUG] No employeeId provided for notifications");
          return [];
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications/${employeeId}`
        );

        console.log(
          "🔔 [DEBUG] Notifications API response status:",
          response.status
        );

        if (!response.ok) {
          console.error(
            "❌ [DEBUG] API response not OK:",
            response.status,
            response.statusText
          );
          return [];
        }

        const data = await response.json();
        console.log("🔔 [DEBUG] Notifications API raw response:", data);

        // ✅ CORRECTED: Extract notifications array from response
        const notifications = data.notifications || data || [];

        console.log(
          "✅ [DEBUG] Loaded notifications from API:",
          notifications.length
        );
        console.log("✅ [DEBUG] Notifications data:", notifications);
        return notifications;
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error fetching notifications:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return [];
      }
    },

    markAsRead: async (notificationId) => {
      try {
        console.log("📝 [DEBUG] Marking notification as read:", notificationId);

        if (!notificationId) {
          console.error("❌ [DEBUG] No notificationId provided for markAsRead");
          return false;
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications/${notificationId}/read`,
          {
            method: "PATCH",
          }
        );

        console.log(
          "📝 [DEBUG] Mark as read response status:",
          response.status
        );

        if (response.ok) {
          console.log(
            "✅ [DEBUG] Notification marked as read:",
            notificationId
          );
          return true;
        } else {
          console.error(
            "❌ [DEBUG] Failed to mark notification as read:",
            response.status
          );
          return false;
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error marking notification as read:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return false;
      }
    },

    markAllAsRead: async (employeeId) => {
      try {
        console.log(
          "📝 [DEBUG] Marking all notifications as read for:",
          employeeId
        );

        if (!employeeId) {
          console.error("❌ [DEBUG] No employeeId provided for markAllAsRead");
          return false;
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications/${employeeId}/read-all`,
          {
            method: "PATCH",
          }
        );

        console.log(
          "📝 [DEBUG] Mark all as read response status:",
          response.status
        );

        if (response.ok) {
          console.log(
            "✅ [DEBUG] All notifications marked as read for:",
            employeeId
          );
          return true;
        } else {
          console.error(
            "❌ [DEBUG] Failed to mark all notifications as read:",
            response.status
          );
          return false;
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error marking all notifications as read:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return false;
      }
    },

    getUnreadCount: async (employeeId) => {
      try {
        console.log("📊 [DEBUG] Getting unread count for:", employeeId);

        if (!employeeId) {
          console.error("❌ [DEBUG] No employeeId provided for getUnreadCount");
          return 0;
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications/${employeeId}/unread-count`
        );

        console.log(
          "📊 [DEBUG] Unread count response status:",
          response.status
        );

        if (response.ok) {
          const data = await response.json();
          const count = data.count || data || 0;
          console.log("📊 [DEBUG] Unread count from API:", count);
          return count;
        } else {
          console.error(
            "❌ [DEBUG] Failed to get unread count:",
            response.status
          );
          console.log("📊 [DEBUG] Fallback unread count: 0");
          return 0;
        }
      } catch (error) {
        console.error("❌ [DEBUG] Error getting unread count:", error.message);
        console.error("❌ [DEBUG] Full error:", error);
        return 0;
      }
    },

    // NEW: Send onboarding reminder with debug logging
    sendOnboardingReminder: async (onboardingData) => {
      try {
        console.log("🔔 [DEBUG] Sending onboarding reminder:", onboardingData);

        if (!onboardingData) {
          console.error(
            "❌ [DEBUG] No onboardingData provided for sendOnboardingReminder"
          );
          return false;
        }

        // Validate required fields
        const requiredFields = [
          "employeeId",
          "employeeName",
          "employeeEmail",
          "currentStep",
        ];
        const missingFields = requiredFields.filter(
          (field) => !onboardingData[field]
        );

        if (missingFields.length > 0) {
          console.error(
            "❌ [DEBUG] Missing required fields for onboarding reminder:",
            missingFields
          );
          return false;
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications/onboarding/reminder`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(onboardingData),
          }
        );

        console.log(
          "🔔 [DEBUG] Onboarding reminder response status:",
          response.status
        );

        if (response.ok) {
          const result = await response.json();
          console.log(
            "✅ [DEBUG] Onboarding reminder sent successfully:",
            result
          );
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "❌ [DEBUG] Failed to send onboarding reminder:",
            response.status,
            errorData
          );
          return false;
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error sending onboarding reminder:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return false;
      }
    },

    // ✅ NEW: Send document submission notification
    sendDocumentSubmissionNotification: async (submissionData) => {
      try {
        console.log(
          "🔔 [DEBUG] Sending document submission notification:",
          submissionData
        );

        if (!submissionData) {
          console.error(
            "❌ [DEBUG] No submissionData provided for document submission notification"
          );
          return false;
        }

        // Validate required fields
        const requiredFields = [
          "employeeId",
          "employeeName",
          "adminId",
          "adminEmail",
        ];
        const missingFields = requiredFields.filter(
          (field) => !submissionData[field]
        );

        if (missingFields.length > 0) {
          console.error(
            "❌ [DEBUG] Missing required fields for document submission notification:",
            missingFields
          );
          return false;
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications/documents/submitted`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(submissionData),
          }
        );

        console.log(
          "🔔 [DEBUG] Document submission notification response status:",
          response.status
        );

        if (response.ok) {
          const result = await response.json();
          console.log(
            "✅ [DEBUG] Document submission notification sent successfully:",
            result
          );
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "❌ [DEBUG] Failed to send document submission notification:",
            response.status,
            errorData
          );
          return false;
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error sending document submission notification:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return false;
      }
    },
  };

  // Leave Settings API with debug logging
  const leaveSettingsApi = {
    get: async () => {
      try {
        console.log("🔄 [DEBUG] Fetching leave settings...");
        const response = await fetch(`${API_BASE_URL}/leaves/settings`);

        console.log(
          "🔄 [DEBUG] Leave settings response status:",
          response.status
        );

        if (response.ok) {
          const settings = await response.json();
          console.log(
            "✅ [DEBUG] Leave settings fetched successfully:",
            settings
          );
          setLeaveSettings(settings);
          return settings;
        } else {
          console.error(
            "❌ [DEBUG] Failed to fetch leave settings:",
            response.status
          );
          return leaveSettings;
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error fetching leave settings:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return leaveSettings;
      }
    },

    update: async (newSettings) => {
      try {
        console.log("🔄 [DEBUG] Updating leave settings:", newSettings);

        const response = await fetch(`${API_BASE_URL}/leaves/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newSettings,
            updatedBy: user?.name || "Admin",
          }),
        });

        console.log(
          "🔄 [DEBUG] Update leave settings response status:",
          response.status
        );

        if (response.ok) {
          const result = await response.json();
          console.log(
            "✅ [DEBUG] Leave settings updated successfully:",
            result
          );
          setLeaveSettings(result.settings);
          return result.settings;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "❌ [DEBUG] Failed to update leave settings:",
            response.status,
            errorData
          );
          throw new Error(
            errorData.message || "Failed to update leave settings"
          );
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error updating leave settings:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        throw error;
      }
    },
  };

  // Enhanced API functions for leave requests with better error handling and debug logging
  const leaveApi = {
    getAll: async (filters = {}) => {
      try {
        console.log("🔄 [DEBUG] Fetching all leaves from backend...", filters);
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append("status", filters.status);
        if (filters.employeeId)
          queryParams.append("employeeId", filters.employeeId);

        const url = `${API_BASE_URL}/leaves${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`;

        console.log("🔄 [DEBUG] Leaves API URL:", url);

        const response = await fetch(url);

        console.log("🔄 [DEBUG] Leaves API response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(
            "✅ [DEBUG] Leaves fetched successfully:",
            data.length,
            "records"
          );
          setLeaveRequests(data);
          return data;
        } else {
          console.error(
            "❌ [DEBUG] Failed to fetch leaves, status:",
            response.status
          );
          return leaveRequests;
        }
      } catch (error) {
        console.error("❌ [DEBUG] Error fetching leaves:", error.message);
        console.error("❌ [DEBUG] Full error:", error);
        return leaveRequests;
      }
    },

    getLeavesByEmployee: async (employeeId) => {
      try {
        if (!employeeId) {
          console.error(
            "❌ [DEBUG] No employeeId provided for getLeavesByEmployee"
          );
          return [];
        }

        console.log("🔄 [DEBUG] Fetching leaves for employee:", employeeId);
        const response = await fetch(
          `${API_BASE_URL}/leaves/employee/${employeeId}`
        );

        console.log(
          "🔄 [DEBUG] Employee leaves response status:",
          response.status
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            "✅ [DEBUG] Leaves fetched for employee:",
            data.length,
            "records"
          );
          return data;
        } else if (response.status === 404) {
          console.log(
            "ℹ️ [DEBUG] No leaves found for employee, returning empty array"
          );
          return [];
        } else {
          console.error(
            "❌ [DEBUG] Failed to fetch employee leaves, status:",
            response.status
          );
          // Fallback: filter local leave requests by employeeId
          const localLeaves = leaveRequests.filter(
            (req) => req.employeeId === employeeId
          );
          console.log(
            "ℹ️ [DEBUG] Using local leaves as fallback:",
            localLeaves.length,
            "records"
          );
          return localLeaves;
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error fetching employee leaves:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        // Fallback to local storage filtered by employeeId
        const localLeaves = leaveRequests.filter(
          (req) => req.employeeId === employeeId
        );
        console.log(
          "ℹ️ [DEBUG] Using local leaves due to error:",
          localLeaves.length,
          "records"
        );
        return localLeaves;
      }
    },

    getPendingForApprover: async (approverId) => {
      try {
        if (!approverId) {
          console.error(
            "❌ [DEBUG] No approverId provided for getPendingForApprover"
          );
          return [];
        }

        console.log(
          "🔄 [DEBUG] Fetching pending leaves for approver:",
          approverId
        );
        const response = await fetch(
          `${API_BASE_URL}/leaves/approver/${approverId}`
        );

        console.log(
          "🔄 [DEBUG] Pending leaves response status:",
          response.status
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            "✅ [DEBUG] Pending leaves fetched for approver:",
            data.length,
            "records"
          );
          return data;
        } else {
          console.error(
            "❌ [DEBUG] Failed to fetch pending leaves, status:",
            response.status
          );
          return [];
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error fetching pending leaves:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return [];
      }
    },

    getAllForHR: async (filters = {}) => {
      try {
        console.log("🔄 [DEBUG] Fetching all leaves for HR...", filters);
        const data = await leaveApi.getAll(filters);
        return data;
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error fetching all leaves for HR:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        return leaveRequests;
      }
    },

    create: async (leaveData) => {
      try {
        console.log("🔄 [DEBUG] Creating leave request:", leaveData);

        // Validate required fields
        if (!leaveData.employeeId) {
          throw new Error("Employee ID is required");
        }
        if (!leaveData.startDate || !leaveData.endDate) {
          throw new Error("Start date and end date are required");
        }
        if (!leaveData.reason || leaveData.reason.trim().length < 10) {
          throw new Error("Reason must be at least 10 characters long");
        }

        // Validate dates
        const startDate = new Date(leaveData.startDate);
        const endDate = new Date(leaveData.endDate);
        if (endDate < startDate) {
          throw new Error("End date cannot be before start date");
        }

        // Add employee email if not provided
        if (!leaveData.employeeEmail) {
          const employee = employees.find(
            (emp) => emp.id === leaveData.employeeId
          );
          if (employee) {
            leaveData.employeeEmail = employee.email;
          } else {
            leaveData.employeeEmail = `${leaveData.employeeId}@company.com`;
          }
        }

        // Ensure status is pending for new requests
        const leaveDataWithStatus = {
          ...leaveData,
          status: "pending", // Force status to pending
        };

        console.log(
          "🔄 [DEBUG] Sending leave data to backend:",
          leaveDataWithStatus
        );

        const response = await fetch(`${API_BASE_URL}/leaves`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leaveDataWithStatus),
        });

        console.log(
          "🔄 [DEBUG] Create leave response status:",
          response.status
        );

        if (!response.ok) {
          let errorMessage = `Failed to create leave request: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error(
              "❌ [DEBUG] Error parsing error response:",
              parseError
            );
          }
          throw new Error(errorMessage);
        }

        const newLeave = await response.json();
        console.log(
          "✅ [DEBUG] Leave created successfully in database with PENDING status:",
          newLeave
        );

        // Update local state
        setLeaveRequests((prev) => [...prev, newLeave]);

        logAction(
          "Create Leave Request",
          { id: newLeave._id, employee: newLeave.employee },
          null,
          newLeave
        );

        return newLeave;
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error creating leave in backend:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        throw error; // Re-throw to handle in the component
      }
    },

    update: async (id, updatedData) => {
      try {
        console.log("🔄 [DEBUG] Updating leave status:", id, updatedData);

        // Include who is performing the action
        const updatePayload = {
          ...updatedData,
          actionBy: user?.name || "Admin",
        };

        const response = await fetch(`${API_BASE_URL}/leaves/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

        console.log(
          "🔄 [DEBUG] Update leave response status:",
          response.status
        );

        if (response.ok) {
          const updatedLeave = await response.json();
          console.log(
            "✅ [DEBUG] Leave updated successfully in database:",
            updatedLeave
          );

          // Update local state
          setLeaveRequests((prev) =>
            prev.map((leave) =>
              leave._id === id || leave.id === id ? updatedLeave : leave
            )
          );

          logAction(
            "Update Leave Status",
            { id, status: updatedData.status },
            null,
            updatedLeave
          );

          return updatedLeave;
        } else {
          console.error(
            "❌ [DEBUG] Failed to update leave in backend, status:",
            response.status
          );
          throw new Error("Failed to update leave request in backend");
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error updating leave in backend:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        // Fallback to local storage
        const updatedLeave = { ...updatedData };
        setLeaveRequests((prev) =>
          prev.map((leave) =>
            leave.id === id ? { ...leave, ...updatedData } : leave
          )
        );

        console.log("ℹ️ [DEBUG] Updated leave in local storage as fallback");
        return updatedLeave;
      }
    },

    remove: async (id) => {
      try {
        console.log("🔄 [DEBUG] Deleting leave:", id);
        const response = await fetch(`${API_BASE_URL}/leaves/${id}`, {
          method: "DELETE",
        });

        console.log(
          "🔄 [DEBUG] Delete leave response status:",
          response.status
        );

        if (response.ok) {
          console.log("✅ [DEBUG] Leave deleted successfully from database");
          setLeaveRequests((prev) =>
            prev.filter((leave) => leave._id !== id && leave.id !== id)
          );
          logAction("Delete Leave Request", { id });
        } else {
          console.error(
            "❌ [DEBUG] Failed to delete leave from backend, status:",
            response.status
          );
          throw new Error("Failed to delete leave request from backend");
        }
      } catch (error) {
        console.error(
          "❌ [DEBUG] Error deleting leave from backend:",
          error.message
        );
        console.error("❌ [DEBUG] Full error:", error);
        // Fallback to local storage
        setLeaveRequests((prev) => prev.filter((leave) => leave.id !== id));
        console.log("ℹ️ [DEBUG] Deleted leave from local storage as fallback");
      }
    },
  };

  const crudOperations = (items, setItems, itemName) => ({
    getAll: () => {
      console.log(`📊 [DEBUG] Getting all ${itemName}:`, items.length, "items");
      return items;
    },
    getById: (id) => {
      console.log(`📊 [DEBUG] Getting ${itemName} by ID:`, id);
      const item = items.find((item) => item.id === id);
      console.log(`📊 [DEBUG] Found ${itemName}:`, item);
      return item;
    },
    add: (newItemData) => {
      console.log(`➕ [DEBUG] Adding new ${itemName}:`, newItemData);
      const newItem = { ...newItemData, id: newItemData.id || uuidv4() };
      const newItems = [...items, newItem];
      setItems(newItems);
      console.log(`✅ [DEBUG] ${itemName} added successfully:`, newItem);
      logAction(
        `Create ${itemName}`,
        { name: newItem.name || newItem.title },
        null,
        newItem
      );
      return newItem;
    },
    update: (id, updatedData) => {
      console.log(`✏️ [DEBUG] Updating ${itemName}:`, id, updatedData);
      let oldItem = null;
      const newItems = items.map((item) => {
        if (item.id === id) {
          oldItem = { ...item };
          return { ...item, ...updatedData };
        }
        return item;
      });
      setItems(newItems);
      const updatedItem = newItems.find((item) => item.id === id);
      console.log(`✅ [DEBUG] ${itemName} updated successfully:`, updatedItem);
      logAction(
        `Update ${itemName}`,
        { id, name: updatedItem.name || updatedItem.title },
        oldItem,
        updatedItem
      );
      return updatedItem;
    },
    remove: (id) => {
      console.log(`🗑️ [DEBUG] Deleting ${itemName}:`, id);
      const itemToRemove = items.find((item) => item.id === id);
      const newItems = items.filter((item) => item.id !== id);
      setItems(newItems);
      console.log(`✅ [DEBUG] ${itemName} deleted successfully`);
      logAction(
        `Delete ${itemName}`,
        { id, name: itemToRemove.name || itemToRemove.title },
        itemToRemove,
        null
      );
    },
  });

  const value = {
    auditLogs,
    logAction,
    employees: crudOperations(employees, setEmployees, "Employee"),
    teams: crudOperations(teams, setTeams, "Team"),
    departments: crudOperations(departments, setDepartments, "Department"),
    designations: crudOperations(designations, setDesignations, "Designation"),
    locations: crudOperations(locations, setLocations, "Location"),
    companyMessages: crudOperations(
      companyMessages,
      setCompanyMessages,
      "Company Message"
    ),
    onboarding: crudOperations(
      onboarding,
      setOnboarding,
      "Onboarding Candidate"
    ),
    offboarding: crudOperations(
      offboarding,
      setOffboarding,
      "Offboarding Employee"
    ),
    roles: crudOperations(roles, setRoles, "Role"),
    shifts: crudOperations(shifts, setShifts, "Shift"),
    leaveRequests: leaveApi,
    leaveSettings: leaveSettingsApi,
    policies: crudOperations(policies, setPolicies, "Company Policy"),
    hrRequests: crudOperations(hrRequests, setHrRequests, "HR Request"),
    companyHolidays: {
      getAll: () => {
        console.log(
          "📊 [DEBUG] Getting company holidays:",
          companyHolidays.length,
          "holidays"
        );
        return companyHolidays;
      },
    },
    companySettings: {
      get: () => {
        console.log("📊 [DEBUG] Getting company settings:", companySettings);
        return companySettings;
      },
      update: (newSettings) => {
        console.log("✏️ [DEBUG] Updating company settings:", newSettings);
        const oldSettings = { ...companySettings };
        setCompanySettings((prev) => ({ ...prev, ...newSettings }));
        console.log("✅ [DEBUG] Company settings updated successfully");
        logAction("Update Company Settings", {}, oldSettings, {
          ...companySettings,
          ...newSettings,
        });
      },
    },
    // ✅ ENHANCED: Real notification API with proper logging and onboarding support
    notifications: notificationApi,
  };

  console.log("🚀 [DEBUG] AppContext initialized with user:", user?.email);
  console.log("🚀 [DEBUG] AppContext value:", {
    hasUser: !!user,
    employeeCount: employees.length,
    notificationApi: !!notificationApi,
    leaveApi: !!leaveApi,
  });

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
