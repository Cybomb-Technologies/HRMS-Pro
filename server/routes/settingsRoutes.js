// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const { Role, CompanySettings } = require("../models/Settings");
const User = require("../models/User");
const {
  authMiddleware,
  hrMiddleware,
} = require("../middleware/authMiddleware");

// System modules configuration (unchanged)
const SYSTEM_MODULES = [
  {
    module: "dashboard",
    label: "Dashboard",
    pages: [{ path: "/", label: "Dashboard" }],
    description: "Main dashboard overview",
    icon: "📊",
  },
  {
    module: "profile",
    label: "Profile",
    pages: [{ path: "/profile", label: "Profile" }],
    description: "User profile management",
    icon: "👤",
  },
  {
    module: "announcements",
    label: "Announcements",
    pages: [{ path: "/feeds", label: "Announcements" }],
    description: "Company announcements and feeds",
    icon: "📢",
  },
  {
    module: "organization",
    label: "Organization",
    pages: [{ path: "/organization", label: "Organization Chart" }],
    description: "Company organization structure",
    icon: "🏢",
  },
  {
    module: "teams",
    label: "Teams",
    pages: [{ path: "/teams", label: "Teams Management" }],
    description: "Team management and structure",
    icon: "👥",
  },
  {
    module: "employees",
    label: "Employees",
    pages: [{ path: "/employees", label: "Employee Directory" }],
    description: "Employee management and directory",
    icon: "👨‍💼",
  },
  {
    module: "onboarding",
    label: "Onboarding",
    pages: [{ path: "/onboarding", label: "Employee Onboarding" }],
    description: "New employee onboarding process",
    icon: "🎯",
  },
  {
    module: "offboarding",
    label: "Offboarding",
    pages: [{ path: "/offboarding", label: "Employee Offboarding" }],
    description: "Employee exit process",
    icon: "👋",
  },
  {
    module: "leaves",
    label: "Leave Management",
    pages: [{ path: "/leave", label: "Leave Requests" }],
    description: "Leave and time off management",
    icon: "🏖️",
  },
  {
    module: "attendance",
    label: "Attendance",
    pages: [
      { path: "/attendance", label: "Attendance Overview" },
      { path: "/attendance-details", label: "Attendance Details" },
    ],
    description: "Attendance tracking and details",
    icon: "⏰",
  },
  {
    module: "payroll",
    label: "Payroll",
    pages: [
      { path: "/payroll", label: "Payroll Management" },
      { path: "/my-payslips", label: "My Payslips" },
    ],
    description: "Payroll and compensation management",
    icon: "💰",
  },
  {
    module: "reports",
    label: "Reports",
    pages: [{ path: "/reports", label: "Reports & Analytics" }],
    description: "Reports and data analytics",
    icon: "📋",
  },
  {
    module: "approvals",
    label: "Approvals",
    pages: [{ path: "/approvals", label: "Approval Workflows" }],
    description: "Workflow approvals management",
    icon: "✅",
  },
  {
    module: "hr-letters",
    label: "HR Letters",
    pages: [{ path: "/hr-letters", label: "HR Letters & Documents" }],
    description: "HR documents and letter templates",
    icon: "✉️",
  },
  {
    module: "settings",
    label: "Settings",
    pages: [{ path: "/settings", label: "System Settings" }],
    description: "System configuration and settings",
    icon: "⚙️",
  },
];

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

// ==================== COMPANY SETTINGS ====================

// Get company settings
router.get("/company", authMiddleware, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({});

    if (!settings) {
      settings = new CompanySettings({
        name: "Company Name",
        website: "",
        logo: "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "India",
          zipCode: "",
        },
        defaultTimezone: "Asia/Calcutta",
        defaultCurrency: {
          code: "INR",
          symbol: "₹",
          display: "INR (₹)",
          exchangeRate: 1,
        },
        paySchedule: "Monthly",
        holidays: [],
      });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching company settings",
      error: error.message,
    });
  }
});

// FIXED: Get company timezone and currency - Enhanced with better currency handling
router.get("/company/timezone", authMiddleware, async (req, res) => {
  try {
    // Check if user is authenticated via middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let settings = await CompanySettings.findOne({});

    if (!settings) {
      settings = new CompanySettings({
        name: "Company Name",
        address: {
          street: "",
          city: "",
          state: "",
          country: "India",
          zipCode: "",
        },
        defaultTimezone: "Asia/Calcutta",
        defaultCurrency: {
          code: "INR",
          symbol: "₹",
          display: "INR (₹)",
          exchangeRate: 1,
        },
      });
      await settings.save();
    }

    // Ensure currency object has proper structure
    if (
      !settings.defaultCurrency ||
      typeof settings.defaultCurrency !== "object"
    ) {
      console.log("Fixing currency structure from:", settings.defaultCurrency);
      settings.defaultCurrency = {
        code: "INR",
        symbol: "₹",
        display: "INR (₹)",
        exchangeRate: 1,
      };
      await settings.save();
    }

    // Ensure exchange rate is set
    if (!settings.defaultCurrency.exchangeRate) {
      settings.defaultCurrency.exchangeRate =
        EXCHANGE_RATES[settings.defaultCurrency.code] || 1;
      await settings.save();
    }

    console.log("Company Currency Settings:", {
      code: settings.defaultCurrency.code,
      symbol: settings.defaultCurrency.symbol,
      display: settings.defaultCurrency.display,
      exchangeRate: settings.defaultCurrency.exchangeRate,
    });

    res.json({
      success: true,
      data: {
        timezone: settings.defaultTimezone,
        currency: settings.defaultCurrency,
        companyName: settings.name,
        exchangeRates: EXCHANGE_RATES,
      },
    });
  } catch (error) {
    console.error("Error fetching company timezone:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching company timezone",
      error: error.message,
    });
  }
});

// Update company settings
router.put("/company", [authMiddleware, hrMiddleware], async (req, res) => {
  try {
    const {
      name,
      website,
      logo,
      address,
      defaultTimezone,
      defaultCurrency,
      paySchedule,
      security,
    } = req.body;

    let settings = await CompanySettings.findOne({});

    if (!settings) {
      settings = new CompanySettings();
    }

    // Update fields if provided
    if (name !== undefined) settings.name = name;
    if (website !== undefined) settings.website = website;
    if (logo !== undefined) settings.logo = logo;
    if (address !== undefined) {
      settings.address = {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        country: address.country || "India",
        zipCode: address.zipCode || "",
      };
    }
    if (defaultTimezone !== undefined)
      settings.defaultTimezone = defaultTimezone;

    // Handle currency update - parse the display string to extract code and symbol
    if (defaultCurrency !== undefined) {
      console.log("Updating currency to:", defaultCurrency);
      const currencyMatch = defaultCurrency.match(/([A-Z]{3})\s*\(([^)]+)\)/);
      if (currencyMatch) {
        const currencyCode = currencyMatch[1];
        const currencySymbol = currencyMatch[2];
        const exchangeRate = EXCHANGE_RATES[currencyCode] || 1;

        settings.defaultCurrency = {
          code: currencyCode,
          symbol: currencySymbol,
          display: defaultCurrency,
          exchangeRate: exchangeRate,
        };

        console.log("Currency updated successfully:", {
          code: currencyCode,
          symbol: currencySymbol,
          exchangeRate: exchangeRate,
        });
      } else {
        // Fallback to INR if format is unexpected
        console.warn("Invalid currency format, falling back to INR");
        settings.defaultCurrency = {
          code: "INR",
          symbol: "₹",
          display: "INR (₹)",
          exchangeRate: 1,
        };
      }
    }

    if (paySchedule !== undefined) settings.paySchedule = paySchedule;
    if (security !== undefined)
      settings.security = { ...settings.security, ...security };

    await settings.save();

    console.log(
      "Company settings updated - Currency:",
      settings.defaultCurrency
    );

    res.json({
      success: true,
      message: "Company settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    res.status(400).json({
      success: false,
      message: "Error updating company settings",
      error: error.message,
    });
  }
});

// Get exchange rates
router.get("/exchange-rates", authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: EXCHANGE_RATES,
    });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exchange rates",
      error: error.message,
    });
  }
});

// ==================== ROLES & PERMISSIONS ====================

// Get all roles with modules
router.get("/roles", authMiddleware, async (req, res) => {
  try {
    const [customRoles, userRoles] = await Promise.all([
      Role.find({ isSystem: false }).sort({ createdAt: -1 }),
      User.distinct("role"),
    ]);

    // Get system roles with permissions
    const systemRoles = await Promise.all(
      userRoles.map(async (roleName) => {
        if (!roleName) return null;

        const customRole = await Role.findOne({
          name: roleName,
          isSystem: true,
        });
        const userCount = await User.countDocuments({ role: roleName });

        return {
          _id: customRole ? customRole._id : roleName,
          name: roleName,
          description: `${
            roleName.charAt(0).toUpperCase() + roleName.slice(1)
          } System Role`,
          isSystem: true,
          userCount,
          permissions: customRole
            ? customRole.permissions
            : getDefaultPermissionsForRole(roleName),
        };
      })
    );

    const allRoles = [
      ...systemRoles.filter((role) => role !== null),
      ...customRoles,
    ];

    res.json({
      success: true,
      data: {
        roles: allRoles,
        modules: SYSTEM_MODULES,
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching roles",
      error: error.message,
    });
  }
});

// Update role permissions
router.put(
  "/roles/:roleId/permissions",
  [authMiddleware, hrMiddleware],
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "Permissions must be an array",
        });
      }

      let role;
      const userRole = await User.findOne({ role: roleId });
      const isSystemRole = !!userRole;

      if (isSystemRole) {
        role = await Role.findOne({ name: roleId, isSystem: true });

        if (role) {
          role.permissions = permissions;
        } else {
          role = new Role({
            name: roleId,
            description: `${
              roleId.charAt(0).toUpperCase() + roleId.slice(1)
            } System Role`,
            isSystem: true,
            permissions: permissions,
          });
        }
      } else {
        role = await Role.findById(roleId);
        if (!role) {
          return res.status(404).json({
            success: false,
            message: "Role not found",
          });
        }
        role.permissions = permissions;
      }

      await role.save();

      res.json({
        success: true,
        message: "Role permissions updated successfully",
        data: role,
      });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(400).json({
        success: false,
        message: "Error updating role permissions",
        error: error.message,
      });
    }
  }
);

// Create new custom role
router.post("/roles", [authMiddleware, hrMiddleware], async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Role name is required (min 2 characters)",
      });
    }

    const cleanName = name.trim().toLowerCase();

    // Check for existing roles
    const existingUserRole = await User.findOne({ role: cleanName });
    if (existingUserRole) {
      return res.status(400).json({
        success: false,
        message: "A system role with this name already exists",
      });
    }

    const existingCustomRole = await Role.findOne({ name: cleanName });
    if (existingCustomRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    const role = new Role({
      name: cleanName,
      description: description || "",
      isSystem: false,
      permissions:
        permissions ||
        SYSTEM_MODULES.map((module) => ({
          module: module.module,
          accessLevel: "none",
        })),
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(400).json({
      success: false,
      message: "Error creating role",
      error: error.message,
    });
  }
});

// Delete role
router.delete(
  "/roles/:roleId",
  [authMiddleware, hrMiddleware],
  async (req, res) => {
    try {
      const { roleId } = req.params;

      // Check if it's a system role by name
      const userRole = await User.findOne({ role: roleId });
      if (userRole) {
        await Role.findOneAndDelete({ name: roleId, isSystem: true });
        return res.json({
          success: true,
          message: "Custom permissions removed for system role",
        });
      }

      const role = await Role.findByIdAndDelete(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      res.json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(400).json({
        success: false,
        message: "Error deleting role",
        error: error.message,
      });
    }
  }
);

// ==================== HOLIDAYS ====================

// Get company holidays
router.get("/company/holidays", authMiddleware, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({});
    if (!settings) {
      settings = new CompanySettings({
        name: "Company Name",
        website: "",
        logo: "",
        holidays: [],
      });
      await settings.save();
    }

    // Ensure holidays is always an array
    const holidays = settings.holidays || [];

    res.json({
      success: true,
      data: { holidays },
    });
  } catch (error) {
    console.error("Error fetching company holidays:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching company holidays",
      error: error.message,
    });
  }
});

// Update company holidays
router.put(
  "/company/holidays",
  [authMiddleware, hrMiddleware],
  async (req, res) => {
    try {
      const { holidays } = req.body;

      if (!Array.isArray(holidays)) {
        return res.status(400).json({
          success: false,
          message: "Holidays must be an array",
        });
      }

      let settings = await CompanySettings.findOne({});
      if (!settings) {
        settings = new CompanySettings({
          name: "Company Name",
          website: "",
          logo: "",
          holidays: [],
        });
      }

      // Validate and normalize holiday data
      settings.holidays = holidays
        .map((h) => ({
          id: h.id || new mongoose.Types.ObjectId().toString(),
          name: h.name || "Unnamed Holiday",
          date: h.date ? new Date(h.date) : new Date(),
        }))
        .filter((h) => h.name && h.date);

      await settings.save();

      res.json({
        success: true,
        message: "Holidays updated successfully",
        data: { holidays: settings.holidays },
      });
    } catch (error) {
      console.error("Error updating holidays:", error);
      res.status(400).json({
        success: false,
        message: "Error updating holidays",
        error: error.message,
      });
    }
  }
);

// ==================== ORGANIZATION SETTINGS ====================

// Get organization settings (for the frontend endpoint)
router.get("/organization", authMiddleware, async (req, res) => {
  try {
    const [settings, rolesData] = await Promise.all([
      CompanySettings.findOne({}),
      Role.find({}),
    ]);

    const defaultSettings = {
      name: "Company Name",
      website: "",
      logo: "",
      defaultTimezone: "Asia/Calcutta",
      defaultCurrency: {
        code: "INR",
        symbol: "₹",
        display: "INR (₹)",
        exchangeRate: 1,
      },
      paySchedule: "Monthly",
      holidays: [],
    };

    res.json({
      success: true,
      data: {
        companySettings: settings || defaultSettings,
        roles: rolesData || [],
        availablePages: SYSTEM_MODULES,
      },
    });
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching organization settings",
      error: error.message,
    });
  }
});

// ==================== USER PERMISSIONS ====================

// Get current user's permissions
router.get("/my-permissions", authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;

    if (!userRole) {
      return res.json({
        success: true,
        data: {
          permissions: {},
          accessiblePages: [],
          role: "none",
        },
      });
    }

    const roleDoc = await Role.findOne({ name: userRole, isSystem: true });
    const permissions = roleDoc
      ? roleDoc.permissions
      : getDefaultPermissionsForRole(userRole);

    const permissionsObj = {};
    const accessiblePages = [];

    permissions.forEach((perm) => {
      permissionsObj[perm.module] = perm.accessLevel;
      const module = SYSTEM_MODULES.find((m) => m.module === perm.module);
      if (module && perm.accessLevel !== "none") {
        accessiblePages.push(...module.pages);
      }
    });

    res.json({
      success: true,
      data: {
        permissions: permissionsObj,
        accessiblePages,
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching permissions",
      error: error.message,
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getDefaultPermissionsForRole(roleName) {
  const basePermissions = [
    { module: "dashboard", accessLevel: "read" },
    { module: "profile", accessLevel: "read" },
    { module: "settings", accessLevel: "read" },
  ];

  switch (roleName.toLowerCase()) {
    case "admin":
      return SYSTEM_MODULES.map((module) => ({
        module: module.module,
        accessLevel: "crud",
      }));
    case "hr":
      return [
        ...basePermissions,
        { module: "employees", accessLevel: "crud" },
        { module: "onboarding", accessLevel: "crud" },
        { module: "offboarding", accessLevel: "crud" },
        { module: "leaves", accessLevel: "crud" },
        { module: "attendance", accessLevel: "crud" },
        { module: "payroll", accessLevel: "read" },
        { module: "reports", accessLevel: "read" },
        { module: "approvals", accessLevel: "crud" },
        { module: "hr-letters", accessLevel: "crud" },
        { module: "announcements", accessLevel: "crud" },
        { module: "organization", accessLevel: "read" },
        { module: "teams", accessLevel: "crud" },
      ];
    case "employee":
      return [
        ...basePermissions,
        { module: "leaves", accessLevel: "read-self" },
        { module: "attendance", accessLevel: "read-self" },
        { module: "payroll", accessLevel: "read-self" },
        { module: "announcements", accessLevel: "read" },
      ];
    case "employer":
      return [
        ...basePermissions,
        { module: "employees", accessLevel: "read" },
        { module: "payroll", accessLevel: "read" },
        { module: "reports", accessLevel: "read" },
        { module: "organization", accessLevel: "read" },
        { module: "announcements", accessLevel: "read" },
      ];
    default:
      return basePermissions;
  }
}

module.exports = router;
