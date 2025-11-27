import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AdminAttendanceProvider } from "@/contexts/AdminAttendanceContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import TeamSection from "@/pages/TeamSection";
import OrganizationSection from "@/pages/OrganizationSection";
import EmployeeSection from "@/pages/EmployeeSection";
import ProfilePage from "@/pages/ProfilePage";
import OnboardingSection from "@/pages/OnboardingSection";
import OffboardingSection from "@/pages/OffboardingSection";
import LeaveSection from "@/pages/LeaveSection";
import AttendanceSection from "@/pages/AttendanceSection";
import PayrollSection from "@/pages/PayrollSection";
import HRLetters from "@/pages/HRLettersSection";
import SettingsSection from "@/pages/SettingsSection";
import AuditSection from "@/pages/AuditSection";
import ReportsSection from "@/pages/ReportsSection";
import ApprovalsSection from "@/pages/ApprovalsSection";
import SearchResultsPage from "@/pages/SearchResultsPage";
import CompanyPolicyPage from "@/pages/CompanyPolicyPage";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedsSection from "@/pages/FeedsSection";
import EmployeeLeavePage from "./pages/EmployeeLeavePage";
import AttendanceTab from "./components/Dashboard/EmployeeTabs/AttendanceTab";
import EmployeePayslipsPage from "./pages/EmployeePayslipsPage";
import PolicyEmployee from "./pages/EmployeePolicy";
import EmployeeDashboard from "./components/Dashboard/EmployeeDashboard";
import EmpOnboarding from "./pages/emponboarding";
import EmpOffboarding from "./pages/empoffboarding";
import LetterTemplates from "./pages/LetterTemplates";
import EditorPage from "./pages/EditorPage";

const AppRoutes = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const isHR = user?.role === "hr";
  const isAdmin = user?.role === "admin";
  const isAdminOrHR = isAdmin || isHR;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>{isHR && <EmployeeDashboard />}</Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <TeamSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? (
                <Navigate to="/" replace />
              ) : (
                <OrganizationSection />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <EmployeeSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:employeeId"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <ProfilePage />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <OnboardingSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/offboarding"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? (
                <Navigate to="/" replace />
              ) : (
                <OffboardingSection />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-onboarding"
        element={
          <ProtectedRoute>
            <Layout>
              <EmpOnboarding />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-offboarding"
        element={
          <ProtectedRoute>
            <Layout>
              <EmpOffboarding />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <EmployeeLeavePage /> : <LeaveSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance-details"
        element={
          <ProtectedRoute>
            <Layout>
              <AttendanceSection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Layout>
              {isHR && <AttendanceTab />}
              {isEmployee ? <AttendanceTab /> : <AttendanceSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <PayrollSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-payslips"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? (
                <EmployeePayslipsPage />
              ) : (
                <Navigate to="/payroll" replace />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/letter-templates"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <LetterTemplates />}
            </Layout>
          </ProtectedRoute>
        }
      /> 
      <Route
        path="/hr-letters"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <HRLetters />}
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Editor Route - Only for Admin and HR */}
      <Route
        path="/editor/:id"
        element={
          <ProtectedRoute>
            <Layout>
              {isAdminOrHR ? <EditorPage /> : <Navigate to="/" replace />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsSection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <AuditSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <Navigate to="/" replace /> : <ReportsSection />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <Layout>
              <ApprovalsSection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Layout>
              <SearchResultsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company-policy"
        element={
          <ProtectedRoute>
            <Layout>
              {isEmployee ? <PolicyEmployee /> : <CompanyPolicyPage />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feeds"
        element={
          <ProtectedRoute>
            <Layout>
              <FeedsSection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <>
      <Helmet>
        <title>HRMS Pro - Complete Human Resource Management System</title>
        <meta
          name="description"
          content="Production-ready HRMS with integrated payroll, multi-country tax engines, and comprehensive employee management for modern businesses."
        />
      </Helmet>

      <ThemeProvider defaultTheme="light" storageKey="hrms-ui-theme">
        <CurrencyProvider>
          <AuthProvider>
            <AdminAttendanceProvider>
              <TenantProvider>
                <AppProvider>
                  <Router>
                    <div className="min-h-screen bg-background text-foreground">
                      <AppRoutes />
                      <Toaster />
                    </div>
                  </Router>
                </AppProvider>
              </TenantProvider>
            </AdminAttendanceProvider>
          </AuthProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </>
  );
}

export default App;