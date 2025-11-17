// components/settings/context/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const [settingsData, setSettingsData] = useState({
    name: "",
    website: "",
    logo: "",
    defaultTimezone: "(GMT-05:00) Eastern Time",
    defaultCurrency: {
      code: "INR",
      symbol: "₹",
      display: "INR (₹)",
      exchangeRate: 1,
    },
    paySchedule: "Monthly",
    security: {
      twoFactorAuth: false,
      passwordPolicy: {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        rotationDays: 90,
      },
    },
  });
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Exchange rates relative to INR
  const EXCHANGE_RATES = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AED: 0.044,
    SAR: 0.045,
    SGD: 0.016,
    AUD: 0.018,
    CAD: 0.016,
    JPY: 1.78,
    CNY: 0.087,
    HKD: 0.094,
  };

  // API request utility
  const apiRequest = async (url, options = {}) => {
    try {
      const token = localStorage.getItem("hrms_token");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...options,
      };

      // Handle body data
      if (options.body) {
        config.body = options.body;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        localStorage.removeItem("hrms_token");
        localStorage.removeItem("hrms_user");
        window.location.href = "/login";
        throw new Error("Authentication failed. Please login again.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("API request failed:", error);
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please check your connection.");
      }
      throw error;
    }
  };

  // Parse currency string to object
  const parseCurrency = (currencyString) => {
    if (typeof currencyString === "string") {
      const currencyMatch = currencyString.match(/([A-Z]{3})\s*\(([^)]+)\)/);
      if (currencyMatch) {
        const code = currencyMatch[1];
        const symbol = currencyMatch[2];
        return {
          code,
          symbol,
          display: currencyString,
          exchangeRate: EXCHANGE_RATES[code] || 1,
        };
      }
    }

    // Default to INR if parsing fails
    return {
      code: "INR",
      symbol: "₹",
      display: "INR (₹)",
      exchangeRate: 1,
    };
  };

  // Format currency object to string for API
  const formatCurrencyForAPI = (currencyObj) => {
    if (typeof currencyObj === "string") {
      return currencyObj;
    }
    if (currencyObj && currencyObj.display) {
      return currencyObj.display;
    }
    return "INR (₹)";
  };

  // Fetch settings data
  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("hrms_token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        toast({
          title: "Authentication Required",
          description: "Please login to access settings",
          variant: "destructive",
        });
        return;
      }

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? window.location.origin
          : "http://localhost:5000";

      const [settingsRes, rolesRes, timezoneRes] = await Promise.allSettled([
        apiRequest(`${baseUrl}/api/settings/company`),
        apiRequest(`${baseUrl}/api/settings/roles`),
        apiRequest(`${baseUrl}/api/settings/company/timezone`),
      ]);

      // Handle settings response
      if (settingsRes.status === "fulfilled" && settingsRes.value?.success) {
        const companySettings = settingsRes.value.data || {};

        // Parse currency data - FIXED: Always use saved currency from DB
        let currencyData;
        if (companySettings.defaultCurrency) {
          if (typeof companySettings.defaultCurrency === "object") {
            currencyData = companySettings.defaultCurrency;
          } else {
            currencyData = parseCurrency(companySettings.defaultCurrency);
          }
        } else {
          // Default to INR if no currency saved
          currencyData = {
            code: "INR",
            symbol: "₹",
            display: "INR (₹)",
            exchangeRate: 1,
          };
        }

        console.log(
          "🔄 SettingsContext - Loaded currency from DB:",
          currencyData
        );

        setSettingsData((prev) => ({
          ...prev,
          ...companySettings,
          name: companySettings.name || prev.name,
          website: companySettings.website || prev.website,
          logo: companySettings.logo || prev.logo,
          defaultTimezone:
            companySettings.defaultTimezone || prev.defaultTimezone,
          defaultCurrency: currencyData, // Use saved currency from DB
          paySchedule: companySettings.paySchedule || prev.paySchedule,
          holidays: companySettings.holidays || prev.holidays,
          security: {
            ...prev.security,
            ...(companySettings.security || {}),
          },
        }));
      } else {
        console.warn("Failed to fetch company settings:", settingsRes.reason);
      }

      // Handle timezone response for currency - FIXED: Only use timezone API for timezone, not currency
      if (timezoneRes.status === "fulfilled" && timezoneRes.value?.success) {
        const timezoneData = timezoneRes.value.data;
        // Only update timezone, not currency (currency comes from company settings)
        if (timezoneData.timezone) {
          setSettingsData((prev) => ({
            ...prev,
            defaultTimezone: timezoneData.timezone || prev.defaultTimezone,
          }));
        }
      } else {
        console.warn("Failed to fetch timezone settings:", timezoneRes.reason);
      }

      // Handle roles response
      if (rolesRes.status === "fulfilled" && rolesRes.value?.success) {
        const rolesData = rolesRes.value.data;
        setRoles(rolesData.roles || []);
        setModules(rolesData.modules || []);
      } else {
        console.warn("Failed to fetch roles:", rolesRes.reason);
      }
    } catch (error) {
      console.error("Error in fetchSettingsData:", error);
      if (error.message.includes("Authentication failed")) {
        setError("Authentication failed. Redirecting to login...");
        setTimeout(() => {
          logout();
          window.location.href = "/login";
        }, 2000);
      } else {
        setError("Failed to load settings. Please check your connection.");
        toast({
          title: "Connection Error",
          description: "Unable to connect to settings server",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = (updates) => {
    console.log("⚙️ SettingsContext - Updating settings:", updates);

    setSettingsData((prev) => {
      const newSettings = { ...prev, ...updates };

      // Handle currency updates specifically
      if (
        updates.defaultCurrency &&
        typeof updates.defaultCurrency === "string"
      ) {
        const currencyData = parseCurrency(updates.defaultCurrency);
        newSettings.defaultCurrency = currencyData;
        console.log("💰 SettingsContext - Currency updated:", currencyData);
      }

      return newSettings;
    });
  };

  // Save settings - FIXED: Ensure currency is properly saved to DB
  const saveSettings = async (section) => {
    try {
      setLoading(true);
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? window.location.origin
          : "http://localhost:5000";

      // Prepare data for API - convert currency object to string
      const apiData = {
        ...settingsData,
        defaultCurrency: formatCurrencyForAPI(settingsData.defaultCurrency),
      };

      console.log(
        "💾 SettingsContext - Saving settings with currency:",
        apiData.defaultCurrency
      );

      const response = await apiRequest(`${baseUrl}/api/settings/company`, {
        method: "PUT",
        body: JSON.stringify(apiData),
      });

      if (response.success) {
        // Trigger currency update event for the entire app
        window.dispatchEvent(
          new CustomEvent("currencyUpdated", {
            detail: settingsData.defaultCurrency,
          })
        );

        console.log(
          "✅ SettingsContext - Settings saved, currency event dispatched"
        );

        toast({
          title: `Saved ${section} Settings`,
          description: "Your changes have been saved successfully.",
        });
        return true;
      } else {
        throw new Error(response.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Save Failed",
        description:
          error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Refresh currency settings
  const refreshCurrency = async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? window.location.origin
          : "http://localhost:5000";

      const response = await apiRequest(
        `${baseUrl}/api/settings/company/timezone`
      );

      if (response.success && response.data.currency) {
        let currencyData;
        if (typeof response.data.currency === "object") {
          currencyData = response.data.currency;
        } else {
          currencyData = parseCurrency(response.data.currency);
        }

        console.log("🔄 SettingsContext - Refreshed currency:", currencyData);

        setSettingsData((prev) => ({
          ...prev,
          defaultCurrency: currencyData,
          defaultTimezone: response.data.timezone || prev.defaultTimezone,
        }));

        // Dispatch currency update event
        window.dispatchEvent(
          new CustomEvent("currencyUpdated", {
            detail: currencyData,
          })
        );

        return currencyData;
      }
    } catch (error) {
      console.error("Error refreshing currency:", error);
    }
  };

  // Handle actions
  const handleAction = (action) => {
    toast({
      title: "Feature Coming Soon",
      description: `${action} feature is currently under development.`,
    });
  };

  // Refresh data
  const refreshData = () => {
    fetchSettingsData();
  };

  // Listen for currency updates from other components
  useEffect(() => {
    const handleCurrencyUpdate = (event) => {
      console.log(
        "🔄 SettingsContext - Received currency update:",
        event.detail
      );
      if (event.detail) {
        setSettingsData((prev) => ({
          ...prev,
          defaultCurrency: event.detail,
        }));
      }
    };

    window.addEventListener("currencyUpdated", handleCurrencyUpdate);

    return () => {
      window.removeEventListener("currencyUpdated", handleCurrencyUpdate);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSettingsData();
  }, []);

  const value = {
    settingsData,
    roles,
    modules,
    loading,
    error,
    updateSettings,
    saveSettings,
    fetchSettingsData: refreshData,
    handleAction,
    apiRequest,
    refreshCurrency,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
