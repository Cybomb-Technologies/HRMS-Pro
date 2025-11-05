// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
// Import the full controller functions
const { 
  getDashboardStats, 
  getRecentActivity, 
  getSystemStatus 
} = require('../controllers/dashboardController'); // Assuming dashboardController.js is at ../controllers/dashboardController.js

// Simple health check (keep as is)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Register the routes with the full controller functions
router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/system-status', getSystemStatus);

module.exports = router;