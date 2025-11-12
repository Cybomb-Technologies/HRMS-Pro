const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Department = require('../models/Department');

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
      // Search employees - FIXED: Include all possible name fields
      Employee.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { employeeId: { $regex: query, $options: 'i' } },
          { 'position.title': { $regex: query, $options: 'i' } },
          // Add search for any name field that might contain the full name
          { $expr: { $regexMatch: { 
            input: { $concat: ["$firstName", " ", "$lastName"] }, 
            regex: query, 
            options: "i" 
          }}}
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

    // Transform results into consistent format - IMPROVED NAME HANDLING
    const results = [
      ...employees.map(emp => {
        console.log('Employee data from DB:', emp); // Debug log
        
        // Handle all possible name field combinations
        let fullName = '';
        
        // Case 1: Both firstName and lastName exist
        if (emp.firstName && emp.lastName) {
          fullName = `${emp.firstName} ${emp.lastName}`.trim();
        } 
        // Case 2: Only firstName exists
        else if (emp.firstName) {
          fullName = emp.firstName;
        }
        // Case 3: Only lastName exists  
        else if (emp.lastName) {
          fullName = emp.lastName;
        }
        // Case 4: Check for any other name fields that might exist
        else if (emp.name) {
          fullName = emp.name;
        }
        // Case 5: Fallback to email or unknown
        else if (emp.email) {
          fullName = emp.email.split('@')[0]; // Use username part of email
        }
        else {
          fullName = 'Unknown Employee';
        }

        return {
          id: emp.employeeId || emp._id,
          name: fullName,
          firstName: emp.firstName,
          lastName: emp.lastName,
          type: 'employee',
          department: emp.department,
          email: emp.email,
          avatar: emp.profilePicture,
          designation: emp.position?.title
        };
      }),
      ...departments.map(dept => ({
        id: dept._id,
        name: dept.name,
        type: 'department',
        description: dept.description
      })),
    ];

    console.log('Final search results:', results); // Debug log

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;