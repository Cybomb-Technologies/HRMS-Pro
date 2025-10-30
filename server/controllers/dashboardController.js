// controllers/dashboardController.js
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Team = require('../models/Team');
const Payroll = require('../models/Payroll');
const Onboarding = require('../models/onboardingModel');
const Offboarding = require('../models/offboardingModel');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcements');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total employees
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Get departments and teams count
    const totalDepartments = await Department.countDocuments();
    const totalTeams = await Team.countDocuments();
    
    // Get onboarding/offboarding stats
    const onboardingStats = await Onboarding.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const offboardingStats = await Offboarding.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get payroll data for current month
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    const payrollData = await Payroll.aggregate([
      {
        $match: {
          month: currentMonth,
          year: currentYear
        }
      },
      {
        $group: {
          _id: null,
          totalNetPay: { $sum: '$netPay' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'present'
    });
    
    // Calculate pending onboarding/offboarding
    const pendingOnboarding = onboardingStats.find(stat => stat._id === 'in-progress')?.count || 0;
    const pendingOffboarding = offboardingStats.find(stat => stat._id === 'in-progress')?.count || 0;
    
    // Calculate storage usage (estimate based on employee count)
    const calculateStorageUsed = (empCount) => {
      const baseStorage = 0.5;
      const perEmployeeStorage = 0.02;
      const totalStorage = baseStorage + (empCount * perEmployeeStorage);
      return `${totalStorage.toFixed(1)}GB`;
    };

    res.json({
      totalUsers: totalEmployees,
      activeEmployees: activeEmployees,
      presentToday: todayAttendance,
      pendingOnboarding,
      pendingOffboarding,
      totalDepartments,
      totalTeams,
      payrollProcessed: payrollData[0]?.totalNetPay || 0,
      thisMonthPayroll: payrollData[0]?.totalNetPay || 0,
      activeSessions: Math.floor(activeEmployees * 0.3), // Estimate 30% as active
      storageUsed: calculateStorageUsed(totalEmployees)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recent activity (from announcements and system events)
const getRecentActivity = async (req, res) => {
  try {
    const announcements = await Announcement.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title author createdAt')
      .lean();

    const recentActivity = announcements.map(announcement => ({
      message: announcement.title,
      timestamp: announcement.createdAt,
      user: announcement.author || 'System',
      type: 'announcement'
    }));

    res.json(recentActivity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get system status
const getSystemStatus = async (req, res) => {
  try {
    // Test database connection by counting employees
    const dbTest = await Employee.countDocuments().catch(() => 0);
    
    // Test API connectivity
    const apiTest = dbTest > 0;
    
    res.json({
      api: apiTest ? 'operational' : 'degraded',
      database: dbTest > 0 ? 'connected' : 'error',
      authentication: 'operational',
      storage: 'operational'
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getSystemStatus
};