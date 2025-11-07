const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Department = require('../models/Department');
// const Document = require('../models/Document');

// Global search endpoint
router.get('/', async (req, res) => {
  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.json([]);
    }

    const query = searchQuery.trim();

    // Search across multiple collections
    const [employees, departments] = await Promise.all([
      // Search employees
      Employee.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { employeeId: { $regex: query, $options: 'i' } },
          { 'position.title': { $regex: query, $options: 'i' } }
        ]
      }).select('firstName lastName email employeeId position department profilePicture').limit(5),

      // Search departments
      Department.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).select('name description manager').limit(5),

      
    ]);

    // Transform results into consistent format
    const results = [
      ...employees.map(emp => ({
        id: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        type: 'employee',
        department: emp.department,
        email: emp.email,
        avatar: emp.profilePicture
      })),
      ...departments.map(dept => ({
        id: dept._id,
        name: dept.name,
        type: 'department',
        description: dept.description
      })),
      
    ];

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;