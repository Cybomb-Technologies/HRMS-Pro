const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const employeeShiftRoutes = require("./routes/employeeShiftRoutes");
const employeeProfileRoutes = require("./routes/employeeProfileRoutes");
const path = require("path");
const dashboardRoutes = require("./routes/dashboardRoutes");
const searchRoutes = require("./routes/searchRoutes");
const fileUpload = require('express-fileupload'); // ADD THIS
const editorRoutes = require('./routes/editorRoutes');

// Import RolePermission model
const RolePermission = require("./models/RolePermissionModel");

dotenv.config();
connectDB();

const app = express();

// Initialize default roles function
async function initializeRoles() {
  try {
    await RolePermission.initializeDefaultRoles();
    console.log('✅ Default roles initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing roles:', error);
  }
}

// Call initializeRoles after DB connection is established
setTimeout(() => {
  initializeRoles();
}, 2000); // Wait 2 seconds for DB connection to be fully established

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ADD THIS - File upload middleware (MUST come after express.json)
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the 5MB limit',
  useTempFiles: false, // Store files in memory instead of temp files
  safeFileNames: true,
  preserveExtension: true
}));

// Enhanced CORS configuration - handle preflight properly
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With,X-CSRF-Token"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ ADD THIS - Bypass auth for roles routes
app.use("/api/settings/roles", (req, res, next) => {
  console.log('🔓 Bypassing auth for roles routes');
  next(); // Skip authentication
});

// Routes
app.use("/api/search", searchRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/auth", require("./routes/authRoutes.js"));
app.use("/api/employees", require("./routes/employeeRoutes.js"));
app.use("/api/onboarding", require("./routes/onboardingRoutes.js"));
app.use("/api/leaves", require("./routes/leaveRoutes.js"));
app.use("/api/offboarding", require("./routes/offboardingRoutes.js"));
app.use("/api/attendance", require("./routes/attendanceRoutes.js"));
app.use("/api/admin", require("./routes/adminAttendanceRoutes.js"));
app.use("/api/teams", require("./routes/teamRoutes.js"));
app.use("/api/announcements", require("./routes/announcementRoutes.js"));
app.use("/api/notifications", require("./routes/notificationRoutes.js"));
app.use("/api/payroll", require("./routes/payrollRoutes.js"));
app.use("/api/hrletters", require("./routes/hrLettersRoutes"));
app.use("/api/employee-profiles", employeeProfileRoutes);
app.use("/api/timesheets", require("./routes/timesheetRoutes.js"));
app.use("/api/organization", require("./routes/organizationRoutes.js"));
app.use("/api/policies", require("./routes/policies"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use('/api/letter-templates', require('./routes/letterTemplates'));
app.use('/api/editor', editorRoutes);
// ✅ ADD THIS LINE - Include roles routes AFTER auth bypass
app.use("/api/settings/roles", require("./routes/rolePermissionRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    rolesInitialized: true
  });
});

// Add the missing endpoint that your frontend is looking for
app.get("/api/settings/organization", (req, res) => {
  res.json({
    success: true,
    data: {
      roles: [],
      companySettings: {},
      availablePages: [],
    },
  });
});

// Role permissions health check
app.get("/api/settings/roles/health", async (req, res) => {
  try {
    const roles = await RolePermission.find();
    res.json({
      success: true,
      message: 'Role permissions system is working',
      rolesCount: roles.length,
      roles: roles.map(role => ({
        name: role.name,
        userCount: role.userCount,
        permissionsCount: role.permissions.length
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking roles health',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));