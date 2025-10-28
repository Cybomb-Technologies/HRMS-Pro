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

  // Real notification API functions
  const notificationApi = {
    get: async (employeeId) => {
      try {
       
        const response = await fetch(
          `${API_BASE_URL}/notifications/${employeeId}`
        );

        if (!response.ok) {
          console.error(
            "❌ API response not OK:",
            response.status,
            response.statusText
          );
          return [];
        }

        const data = await response.json();
        
        // CORRECTED: Extract notifications array from response
        const notifications = data.notifications || [];
        

        return notifications;
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        return [];
      }
    },

    markAsRead: async (notificationId) => {
      try {
       
        const response = await fetch(
          `${API_BASE_URL}/notifications/${notificationId}/read`,
          {
            method: "PATCH",
          }
        );
        return response.ok;
      } catch (error) {
        console.error("❌ Error marking notification as read:", error);
        return false;
      }
    },

    markAllAsRead: async (employeeId) => {
      try {
       
        const response = await fetch(
          `${API_BASE_URL}/notifications/${employeeId}/read-all`,
          {
            method: "PATCH",
          }
        );
        return response.ok;
      } catch (error) {
        console.error("❌ Error marking all notifications as read:", error);
        return false;
      }
    },

    getUnreadCount: async (employeeId) => {
      try {
       
        const response = await fetch(
          `${API_BASE_URL}/notifications/${employeeId}/unread-count`
        );
        if (response.ok) {
          const data = await response.json();
          return data.count || 0;
        }
        return 0;
      } catch (error) {
        console.error("❌ Error getting unread count:", error);
        return 0;
      }
    },
  };

  // Leave Settings API
  const leaveSettingsApi = {
    get: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/leaves/settings`);
        if (response.ok) {
          const settings = await response.json();
          setLeaveSettings(settings);
          return settings;
        } else {
          console.error("Failed to fetch leave settings");
          return leaveSettings;
        }
      } catch (error) {
        console.error("Error fetching leave settings:", error);
        return leaveSettings;
      }
    },

    update: async (newSettings) => {
      try {
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

        if (response.ok) {
          const result = await response.json();
          setLeaveSettings(result.settings);

          return result.settings;
        } else {
          throw new Error("Failed to update leave settings");
        }
      } catch (error) {
        console.error("Error updating leave settings:", error);
        throw error;
      }
    },
  };

  // Enhanced API functions for leave requests with better error handling
  const leaveApi = {
    getAll: async (filters = {}) => {
      try {
        console.log("Fetching all leaves from backend...", filters);
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append("status", filters.status);
        if (filters.employeeId)
          queryParams.append("employeeId", filters.employeeId);

        const url = `${API_BASE_URL}/leaves${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log("Leaves fetched successfully:", data);
          setLeaveRequests(data);
          return data;
        } else {
          console.error("Failed to fetch leaves, status:", response.status);
          return leaveRequests;
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
        return leaveRequests;
      }
    },

    getLeavesByEmployee: async (employeeId) => {
      try {
        if (!employeeId) {
          console.error("No employeeId provided");
          return [];
        }

        console.log("Fetching leaves for employee:", employeeId);
        const response = await fetch(
          `${API_BASE_URL}/leaves/employee/${employeeId}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Leaves fetched for employee:", data);
          return data;
        } else if (response.status === 404) {
          console.log("No leaves found for employee, returning empty array");
          return [];
        } else {
          console.error(
            "Failed to fetch employee leaves, status:",
            response.status
          );
          // Fallback: filter local leave requests by employeeId
          const localLeaves = leaveRequests.filter(
            (req) => req.employeeId === employeeId
          );
          console.log("Using local leaves as fallback:", localLeaves);
          return localLeaves;
        }
      } catch (error) {
        console.error("Error fetching employee leaves:", error);
        // Fallback to local storage filtered by employeeId
        const localLeaves = leaveRequests.filter(
          (req) => req.employeeId === employeeId
        );
        console.log("Using local leaves due to error:", localLeaves);
        return localLeaves;
      }
    },

    getPendingForApprover: async (approverId) => {
      try {
        if (!approverId) {
          console.error("No approverId provided");
          return [];
        }

        console.log("Fetching pending leaves for approver:", approverId);
        const response = await fetch(
          `${API_BASE_URL}/leaves/approver/${approverId}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Pending leaves fetched for approver:", data);
          return data;
        } else {
          console.error(
            "Failed to fetch pending leaves, status:",
            response.status
          );
          return [];
        }
      } catch (error) {
        console.error("Error fetching pending leaves:", error);
        return [];
      }
    },

    getAllForHR: async (filters = {}) => {
      try {
        console.log("Fetching all leaves for HR...", filters);
        const data = await leaveApi.getAll(filters);
        return data;
      } catch (error) {
        console.error("Error fetching all leaves for HR:", error);
        return leaveRequests;
      }
    },

    create: async (leaveData) => {
      try {
        console.log("Sending leave data to backend:", leaveData);

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

        const response = await fetch(`${API_BASE_URL}/leaves`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leaveDataWithStatus),
        });

        if (!response.ok) {
          let errorMessage = `Failed to create leave request: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }

        const newLeave = await response.json();
        console.log(
          "Leave created successfully in database with PENDING status:",
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
        console.error("Error creating leave in backend:", error);
        throw error; // Re-throw to handle in the component
      }
    },

    update: async (id, updatedData) => {
      try {
        console.log("Updating leave status:", id, updatedData);

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

        if (response.ok) {
          const updatedLeave = await response.json();
          console.log("Leave updated successfully in database:", updatedLeave);

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
            "Failed to update leave in backend, status:",
            response.status
          );
          throw new Error("Failed to update leave request in backend");
        }
      } catch (error) {
        console.error("Error updating leave in backend:", error);
        // Fallback to local storage
        const updatedLeave = { ...updatedData };
        setLeaveRequests((prev) =>
          prev.map((leave) =>
            leave.id === id ? { ...leave, ...updatedData } : leave
          )
        );

        console.log("Updated leave in local storage as fallback");
        return updatedLeave;
      }
    },

    remove: async (id) => {
      try {
        console.log("Deleting leave:", id);
        const response = await fetch(`${API_BASE_URL}/leaves/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          console.log("Leave deleted successfully from database");
          setLeaveRequests((prev) =>
            prev.filter((leave) => leave._id !== id && leave.id !== id)
          );
          logAction("Delete Leave Request", { id });
        } else {
          console.error(
            "Failed to delete leave from backend, status:",
            response.status
          );
          throw new Error("Failed to delete leave request from backend");
        }
      } catch (error) {
        console.error("Error deleting leave from backend:", error);
        // Fallback to local storage
        setLeaveRequests((prev) => prev.filter((leave) => leave.id !== id));
        console.log("Deleted leave from local storage as fallback");
      }
    },
  };

  const crudOperations = (items, setItems, itemName) => ({
    getAll: () => items,
    getById: (id) => items.find((item) => item.id === id),
    add: (newItemData) => {
      const newItem = { ...newItemData, id: newItemData.id || uuidv4() };
      const newItems = [...items, newItem];
      setItems(newItems);
      logAction(
        `Create ${itemName}`,
        { name: newItem.name || newItem.title },
        null,
        newItem
      );
      return newItem;
    },
    update: (id, updatedData) => {
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
      logAction(
        `Update ${itemName}`,
        { id, name: updatedItem.name || updatedItem.title },
        oldItem,
        updatedItem
      );
      return updatedItem;
    },
    remove: (id) => {
      const itemToRemove = items.find((item) => item.id === id);
      const newItems = items.filter((item) => item.id !== id);
      setItems(newItems);
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
      getAll: () => companyHolidays,
    },
    companySettings: {
      get: () => companySettings,
      update: (newSettings) => {
        const oldSettings = { ...companySettings };
        setCompanySettings((prev) => ({ ...prev, ...newSettings }));
        logAction("Update Company Settings", {}, oldSettings, {
          ...companySettings,
          ...newSettings,
        });
      },
    },
    // Real notification API
    notifications: notificationApi,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
