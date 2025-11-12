// components/settings/context/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const [settingsData, setSettingsData] = useState({
    name: '',
    website: '',
    logo: '',
    defaultTimezone: '(GMT-05:00) Eastern Time',
    defaultCurrency: 'USD ($)',
    paySchedule: 'Monthly',
    security: {
      twoFactorAuth: false,
      passwordPolicy: {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        rotationDays: 90
      }
    }
  });
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API request utility
  const apiRequest = async (url, options = {}) => {
    try {
      const token = localStorage.getItem("hrms_token");
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        ...options
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
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401) {
        localStorage.removeItem("hrms_token");
        localStorage.removeItem("hrms_user");
        window.location.href = '/login';
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error('API request failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    }
  };

  // Fetch settings data
  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("hrms_token");
      if (!token) {
        setError('No authentication token found. Please login again.');
        toast({
          title: 'Authentication Required',
          description: 'Please login to access settings',
          variant: 'destructive'
        });
        return;
      }

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const [settingsRes, rolesRes] = await Promise.allSettled([
        apiRequest(`${baseUrl}/api/settings/company`),
        apiRequest(`${baseUrl}/api/settings/roles`)
      ]);

      // Handle settings response
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success) {
        const companySettings = settingsRes.value.data || {};
        setSettingsData(prev => ({
          ...prev,
          ...companySettings,
          name: companySettings.name || prev.name,
          website: companySettings.website || prev.website,
          logo: companySettings.logo || prev.logo,
          defaultTimezone: companySettings.defaultTimezone || prev.defaultTimezone,
          defaultCurrency: companySettings.defaultCurrency || prev.defaultCurrency,
          paySchedule: companySettings.paySchedule || prev.paySchedule,
          holidays: companySettings.holidays || prev.holidays,
          security: {
            ...prev.security,
            ...(companySettings.security || {})
          }
        }));
      } else {
        console.warn('Failed to fetch company settings:', settingsRes.reason);
      }

      // Handle roles response
      if (rolesRes.status === 'fulfilled' && rolesRes.value?.success) {
        const rolesData = rolesRes.value.data;
        setRoles(rolesData.roles || []);
        setModules(rolesData.modules || []);
      } else {
        console.warn('Failed to fetch roles:', rolesRes.reason);
      }

    } catch (error) {
      console.error('Error in fetchSettingsData:', error);
      if (error.message.includes('Authentication failed')) {
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => {
          logout();
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load settings. Please check your connection.');
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to settings server',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = (updates) => {
    setSettingsData(prev => ({ ...prev, ...updates }));
  };

  // Save settings
  const saveSettings = async (section) => {
    try {
      setLoading(true);
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const response = await apiRequest(`${baseUrl}/api/settings/company`, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });

      if (response.success) {
        toast({ 
          title: `Saved ${section} Settings`, 
          description: "Your changes have been saved successfully." 
        });
        return true;
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle actions
  const handleAction = (action) => { 
    toast({ 
      title: 'Feature Coming Soon', 
      description: `${action} feature is currently under development.` 
    }); 
  };

  // Refresh data
  const refreshData = () => {
    fetchSettingsData();
  };

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
    apiRequest
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};