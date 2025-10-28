const Employee = require('../models/Employee.js');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');

// GET all employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      personalEmail,
      workPhone,
      department, 
      designation, 
      role,
      employmentType,
      status,
      sourceOfHire,
      location,
      dateOfJoining,
      dateOfBirth,
      maritalStatus,
      totalExperience,
       gender, 
      reportingManager,
      employeeId, 
      password 
    } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = employeeId.trim();

    // Check for duplicates
    const [existingEmployeeByEmail, existingEmployeeById, existingUser] = await Promise.all([
      Employee.findOne({ email: normalizedEmail }),
      Employee.findOne({ employeeId: normalizedEmployeeId }),
      User.findOne({ email: normalizedEmail })
    ]);

    if (existingEmployeeByEmail) {
      return res.status(400).json({ 
        error: 'Employee already exists',
        details: `workEmail ${normalizedEmail} is already registered`,
        field: 'email'
      });
    }
    
    if (existingEmployeeById) {
      return res.status(400).json({ 
        error: 'Employee already exists', 
        details: `Employee ID ${normalizedEmployeeId} is already in use`,
        field: 'employeeId'
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        details: `User account with workEmail ${normalizedEmail} already exists`,
        field: 'email'
      });
    }

    // Create employee
    const newEmployee = new Employee({ 
      employeeId: normalizedEmployeeId, 
      name, 
      email: normalizedEmail, 
      personalEmail,
      workPhone,
      department, 
      designation,
      role,
      employmentType,
      status,
      sourceOfHire,
      location,
      dateOfJoining,
      dateOfBirth,
      maritalStatus,
      gender, 
      reportingManager,
      totalExperience
    });
    
    await newEmployee.save();

    // Hash password before saving user
    const employeePassword = password || "Password123";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(employeePassword, saltRounds);

    // Create user with hashed password
    const newUser = new User({ 
      email: normalizedEmail, 
      password: hashedPassword,
      role: 'employee', 
      employeeId: normalizedEmployeeId
    });
    
    await newUser.save();

    res.status(201).json({ 
      employee: newEmployee,
      tempPassword: !password ? employeePassword : undefined,
      message: `Employee ${name} created successfully. Login email: ${normalizedEmail}`
    });
    } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: err.message });
  }
};

// LOGIN employee
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Work email and password are required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = employeeId.trim();
    
    const [existingEmployeeByEmail, existingEmployeeById, existingUser] = await Promise.all([
      Employee.findOne({ email: normalizedEmail }),
      Employee.findOne({ employeeId: normalizedEmployeeId }),
      User.findOne({ email: normalizedEmail })
    ]);

    // Find user by workEmail
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Find employee details
    const employee = await Employee.findOne({ email: normalizedEmail });
    if (!employee) {
      return res.status(404).json({ 
        error: 'Employee record not found' 
      });
    }

    // Login successful
    res.json({
      message: 'Login successful',
      user: {
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      },
      employee: {
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        employeeId: employee.employeeId
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
};
// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndDelete({ employeeId: id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    await User.findOneAndDelete({ employeeId: id });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findOne({ employeeId: id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If password is being updated, hash it and update User collection
    if (updateData.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(updateData.password, saltRounds);
      
      await User.findOneAndUpdate(
        { employeeId: id },
        { password: hashedPassword }
      );
      
      delete updateData.password;
    }

    // Update workEmail in both collections if changed
    if (updateData.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();
      updateData.email = normalizedEmail;
      
      // Also update in User collection
      await User.findOneAndUpdate(
        { employeeId: id },
        { email: normalizedEmail }
      );
    }

    // Update other fields in Employee collection
    Object.keys(updateData).forEach(key => {
      employee[key] = updateData[key];
    });

    await employee.save();

    res.status(200).json({ 
      message: 'Employee updated successfully', 
      employee 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};