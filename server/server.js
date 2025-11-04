const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const employeeShiftRoutes = require("./routes/employeeShiftRoutes");
const employeeProfileRoutes = require("./routes/employeeProfileRoutes");
const path = require("path");
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
    "Content-Type, Authorization, X-Requested-With"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/auth", require("./routes/authRoutes.js"));
app.use("/api/employees", require("./routes/employeeRoutes.js"));
app.use("/api/onboarding", require("./routes/onboardingRoutes.js"));
app.use("/api/leaves", require("./routes/leaveRoutes.js"));
app.use("/api/offboarding", require("./routes/offboardingRoutes.js"));
app.use("/api/attendance", require("./routes/attendanceRoutes.js"));
app.use("/api/admin", require("./routes/adminAttendanceRoutes.js"));
app.use("/api/teams", require("./routes/teamRoutes.js"));
app.use("/api/employees", employeeShiftRoutes);
app.use("/api/announcements", require("./routes/announcementRoutes.js"));
app.use("/api/notifications", require("./routes/notificationRoutes.js"));
app.use("/api/payroll", require("./routes/payrollRoutes.js"));
app.use("/api/offer-letters", require("./routes/offerLetterRoutes.js"));
app.use("/api/employee-profiles", employeeProfileRoutes);
app.use("/api/timesheets", require("./routes/timesheetRoutes.js"));
app.use("/api/organization", require("./routes/organizationRoutes.js"));
app.use("/api/policies", require("./routes/policies"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
