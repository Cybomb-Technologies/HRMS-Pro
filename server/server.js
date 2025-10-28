const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const employeeShiftRoutes = require('./routes/employeeShiftRoutes');
const employeeProfileRoutes = require('./routes/employeeProfileRoutes');
const path = require('path');
dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Serve static files with proper CORS headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }
}));

// Or use a more explicit approach:
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));
// Auth routes
app.use("/api/auth", require("./routes/authRoutes.js"));
app.use("/api/employees", require("./routes/employeeRoutes.js"));
app.use("/api/onboarding", require("./routes/onboardingRoutes.js"));
app.use("/api/leaves", require("./routes/leaveRoutes.js"));
app.use("/api/offboarding", require("./routes/offboardingRoutes.js"));
app.use("/api/attendance", require("./routes/attendanceRoutes.js"));
app.use("/api/admin", require("./routes/adminAttendanceRoutes.js"));
app.use("/api/teams", require("./routes/teamRoutes.js"));
app.use('/api/employees', employeeShiftRoutes);
app.use("/api/announcements", require("./routes/announcementRoutes.js"));
app.use("/api/notifications", require("./routes/notificationRoutes.js"));
app.use("/api/payroll", require("./routes/payrollRoutes.js"));
app.use('/api/employee-profiles', employeeProfileRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
