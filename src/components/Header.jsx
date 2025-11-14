import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useTheme } from "@/contexts/ThemeProvider";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
  Menu,
  Bell,
  Search,
  Globe,
  LogOut,
  User,
  Settings,
  LifeBuoy,
  Users,
  Briefcase,
  Shield,
  Repeat,
  Sun,
  Moon,
  Palette,
  Mail,
  MailOpen,
  Building2,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  Megaphone,
  Heart,
  MessageSquare,
  UserPlus,
  ClipboardCheck,
  FileText, // ✅ NEW: Import for document submission icon
} from "lucide-react";

const Header = ({ onMenuClick }) => {
  const { user, logout, impersonate, stopImpersonating, isImpersonating } =
    useAuth();
  const { tenant } = useTenant();
  const { setTheme } = useTheme();
  const { notifications } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationList, setNotificationList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // FIXED: Get profile picture URL function
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith("http")) return profilePicture;
    return `http://localhost:5000${profilePicture}`;
  };

  // FIXED: Fetch profile picture from database
  const fetchProfilePicture = async () => {
    if (!user?.email) return;

    try {
      console.log("🔄 [DEBUG] Fetching profile picture for user:", user.email);
      // First try to find employee by email
      const employeesResponse = await fetch(
        "http://localhost:5000/api/employees"
      );
      if (employeesResponse.ok) {
        const employees = await employeesResponse.json();
        const employee = employees.find((emp) => emp.email === user.email);

        if (employee) {
          console.log(
            "✅ [DEBUG] Found employee for profile picture:",
            employee.name
          );
          // Check for profile picture in employee data (direct fields)
          if (employee.profilePicture) {
            setProfilePicture(getProfilePictureUrl(employee.profilePicture));
          } else if (employee.profilePhoto) {
            setProfilePicture(getProfilePictureUrl(employee.profilePhoto));
          } else if (employee.personalInfo?.profilePicture) {
            setProfilePicture(
              getProfilePictureUrl(employee.personalInfo.profilePicture)
            );
          }

          // Also set current employee ID if found
          if (employee.employeeId) {
            setCurrentEmployeeId(employee.employeeId);
          }
        } else {
          console.log(
            "ℹ️ [DEBUG] No employee found for user email:",
            user.email
          );
        }
      }
    } catch (error) {
      console.error("❌ [DEBUG] Error fetching profile picture:", error);
    }
  };

  // FIXED: Get current employee ID - HANDLES BOTH USER COLLECTION AND EMPLOYEE COLLECTION
  const getCurrentEmployeeId = async () => {
    if (!user?.email) {
      console.log("❌ [DEBUG] No user email found");
      return null;
    }

    // For User collection admins (like admin@company.com) - USE _id
    if (
      user._id &&
      ["admin", "hr", "manager", "employer"].includes(user.role)
    ) {
      console.log("✅ [DEBUG] Using user _id for admin:", user._id);
      return user._id.toString();
    }

    // For Employee collection users - try to find by email
    try {
      console.log("🔄 [DEBUG] Searching for employee by email:", user.email);
      const response = await fetch("http://localhost:5000/api/employees");
      if (response.ok) {
        const employees = await response.json();
        const employee = employees.find((emp) => emp.email === user.email);

        if (employee) {
          console.log("✅ [DEBUG] Found employee ID:", employee.employeeId);
          return employee.employeeId;
        } else {
          console.log("ℹ️ [DEBUG] No employee found for email:", user.email);
        }
      }
    } catch (error) {
      console.error("❌ [DEBUG] Error finding employee:", error);
    }

    // Final fallback
    const fallbackId =
      user?.employeeId || user?.id || user?._id?.toString() || user?.email;
    console.log("ℹ️ [DEBUG] Using fallback ID:", fallbackId);
    return fallbackId;
  };

  // ✅ ENHANCED: Load notifications from backend with better error handling
  const loadNotifications = async () => {
    let employeeId = currentEmployeeId;

    // If we don't have employeeId yet, try to get it
    if (!employeeId) {
      console.log("🔄 [DEBUG] No currentEmployeeId, fetching...");
      employeeId = await getCurrentEmployeeId();
      if (employeeId) {
        setCurrentEmployeeId(employeeId);
        console.log("✅ [DEBUG] Set currentEmployeeId:", employeeId);
      }
    }

    if (!employeeId) {
      console.log("❌ [DEBUG] No employee ID found for loading notifications");
      return;
    }

    console.log("🔔 [DEBUG] Loading notifications for employee:", employeeId);

    setLoading(true);
    try {
      const response = await notifications.get(employeeId);
      console.log("🔔 [DEBUG] Notifications API response:", response);

      let notifs = [];

      // Handle response - should be direct array after AppContext fix
      if (Array.isArray(response)) {
        notifs = response;
      } else if (response && response.notifications) {
        notifs = response.notifications;
      }

      // Get unread count
      let count = 0;
      try {
        const countResponse = await notifications.getUnreadCount(employeeId);
        count = countResponse.count || countResponse || 0;
        console.log("🔔 [DEBUG] Unread count from API:", count);
      } catch (countError) {
        console.error("❌ [DEBUG] Error getting unread count:", countError);
        // Fallback: calculate from array
        count = notifs.filter((notif) => !notif.isRead).length;
        console.log("🔔 [DEBUG] Fallback unread count:", count);
      }

      setNotificationList(notifs);
      setUnreadCount(count);
      console.log("✅ [DEBUG] Loaded notifications:", notifs.length);
    } catch (error) {
      console.error("❌ [DEBUG] Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      console.log("📝 [DEBUG] Marking notification as read:", notificationId);
      await notifications.markAsRead(notificationId);
      await loadNotifications(); // Reload to update counts
    } catch (error) {
      console.error("❌ [DEBUG] Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentEmployeeId) {
      console.log(
        "🔄 [DEBUG] No currentEmployeeId, loading notifications first"
      );
      await loadNotifications(); // This will set currentEmployeeId
      return;
    }

    try {
      console.log(
        "📝 [DEBUG] Marking all notifications as read for:",
        currentEmployeeId
      );
      await notifications.markAllAsRead(currentEmployeeId);
      await loadNotifications();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "❌ [DEBUG] Error marking all notifications as read:",
        error
      );
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // ✅ ENHANCED: Notification icon with all types support including onboarding and document submission
  const getNotificationIcon = (type) => {
    switch (type) {
      case "leave_application":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "leave_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "leave_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "leave_cancelled":
        return <Calendar className="h-4 w-4 text-gray-500" />;
      case "announcement":
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      case "announcement_like":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "announcement_comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "onboarding_reminder": // ✅ ADDED: Onboarding reminder icon
        return <UserPlus className="h-4 w-4 text-orange-500" />;
      case "onboarding_step_completed": // ✅ ADDED: Onboarding step completion icon
        return <ClipboardCheck className="h-4 w-4 text-green-500" />;
      case "onboarding_completed": // ✅ ADDED: Onboarding completion icon
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "onboarding_documents_submitted": // ✅ NEW: Document submission icon
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // ✅ ENHANCED: Handle notification click - navigate to appropriate page
  const handleNotificationClick = (notification) => {
    console.log("🔄 [DEBUG] Notification clicked:", notification);
    handleMarkAsRead(notification._id);

    // Navigate based on notification type
    switch (notification.type) {
      case "announcement":
      case "announcement_like":
      case "announcement_comment":
        navigate("/feeds");
        break;
      case "leave_application":
      case "leave_approved":
      case "leave_rejected":
      case "leave_cancelled":
        navigate("/leaves");
        break;
      case "onboarding_reminder":
      case "onboarding_step_completed":
      case "onboarding_completed":
      case "onboarding_documents_submitted": // ✅ NEW: Navigate to onboarding for document submissions
        console.log("🔄 [DEBUG] Navigating to onboarding page");
        if (["admin", "hr", "employer"].includes(user?.role)) {
          navigate("/onboarding"); // Navigate to admin onboarding page
        } else {
          navigate("/my-onboarding"); // Navigate to employee onboarding page
        }
        break;
      default:
        console.log(
          "ℹ️ [DEBUG] No specific navigation for notification type:",
          notification.type
        );
        // Default navigation
        break;
    }
  };

  // Global search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      console.log("🔍 [DEBUG] Searching for:", query);
      const response = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const results = await response.json();
        console.log("✅ [DEBUG] Search results:", results.length);
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        console.error("❌ [DEBUG] Search failed with status:", response.status);
      }
    } catch (error) {
      console.error("❌ [DEBUG] Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive",
      });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("🔍 [DEBUG] Search submitted:", searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounced search as user types
    if (value.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        handleSearch(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchItemClick = (item) => {
    console.log("🔍 [DEBUG] Search item clicked:", item);
    // Navigate based on item type
    switch (item.type) {
      case "employee":
        navigate(`/employees/${item.id}`);
        break;
      case "department":
        navigate(`/organization?dept=${item.id}`);
        break;
      case "document":
        navigate(`/documents/${item.id}`);
        break;
      default:
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }

    setShowSearchResults(false);
    setSearchQuery("");
  };

  // ✅ ENHANCED: Load profile picture and notifications on component mount
  useEffect(() => {
    const initializeData = async () => {
      console.log("🔄 [DEBUG] Initializing header data...");
      await fetchProfilePicture();
      await loadNotifications();
    };

    initializeData();

    // Refresh notifications every 30 seconds for real-time updates
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      console.log("🔄 [DEBUG] Clearing notification interval");
      clearInterval(interval);
    };
  }, [user]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {tenant?.country} • {tenant?.timezone}
              </span>
            </div>
            {user?.role !== "employee" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/teams")}
                >
                  <Users className="w-4 h-4 mr-2" /> Teams
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/organization")}
                >
                  <Building2 className="w-4 h-4 mr-2" /> Organization
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/company-policy")}
            >
              <BookOpen className="w-4 h-4 mr-2" /> Company Policy
            </Button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employees, departments, documents..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {searchResults.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                  onClick={() => handleSearchItemClick(item)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {item.type === "employee" && (
                        <User className="h-4 w-4 text-blue-500" />
                      )}
                      {item.type === "department" && (
                        <Building2 className="h-4 w-4 text-green-500" />
                      )}
                      {item.type === "document" && (
                        <BookOpen className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.type} • {item.department || "General"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {showSearchResults &&
            searchQuery.length > 2 &&
            searchResults.length === 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm text-muted-foreground text-center">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}
        </div>

        <div className="flex items-center space-x-4">
          {/* ✅ ENHANCED: Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-h-96 overflow-y-auto"
            >
              <div className="flex justify-between items-center px-2 py-1">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading notifications...
                  </p>
                </div>
              ) : notificationList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center p-4">
                  No notifications
                </p>
              ) : (
                notificationList.map((notification) => (
                  <DropdownMenuItem
                    key={notification._id}
                    className={`flex flex-col items-start p-3 cursor-pointer ${
                      !notification.isRead
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start w-full gap-2">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-sm ${
                            !notification.isRead
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            notification.createdAt
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profilePicture || user?.avatar}
                    alt={user?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast({
                    title: "Support",
                    description: "Feature not implemented.",
                  })
                }
              >
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>System</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {user?.role === "employer" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Repeat className="mr-2 h-4 w-4" />
                      <span>Impersonate Role</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => impersonate("hr")}>
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>HR</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => impersonate("employee")}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <span>Employee</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </>
              )}

              {isImpersonating && (
                <DropdownMenuItem
                  onClick={stopImpersonating}
                  className="text-blue-600"
                >
                  <Repeat className="mr-2 h-4 w-4" />
                  <span>Stop Impersonating</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
