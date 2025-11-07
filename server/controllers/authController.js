// controllers/authController.js
const User = require('../models/User.js');
const Employee = require('../models/Employee.js');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      employeeId: user.employeeId || null,   // ✅ include employeeId
      email: user.email,
      name: user.name || user.email?.split('@')[0],
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// REGISTER USER
exports.registerUser = async (req, res) => {
  const { name, email, password, role, adminId, hrId, employeeId } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({
      name: name || email.split('@')[0],
      email,
      password,
      role,
      adminId,
      hrId,
      employeeId,
    });

    await newUser.save();

    const token = signToken(newUser);

    res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      adminId: newUser.adminId,
      hrId: newUser.hrId,
      employeeId: newUser.employeeId,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // If employee, validate status
    if (user.role === 'employee') {
      if (!user.employeeId) return res.status(400).json({ message: 'Employee ID not linked with user' });
      const employee = await Employee.findOne({ employeeId: user.employeeId });
      if (!employee) return res.status(400).json({ message: 'Employee record not found' });
      if (employee.status !== 'active' && employee.status !== 'on-probation') {
        return res.status(403).json({ message: `Your account is currently '${employee.status}'. Please contact admin.` });
      }
    }

    const token = signToken(user); // ✅ new payload

    res.status(200).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      adminId: user.adminId || null,
      hrId: user.hrId || null,
      employeeId: user.employeeId || null,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
