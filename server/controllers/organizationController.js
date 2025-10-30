// controllers/organizationController.js
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Location = require('../models/Location');
const Employee = require('../models/Employee');

// In organizationController.js - Update getDepartments function
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('headDetails', 'name email employeeId department designation profilePhoto')
      .populate('employees', 'name employeeId email designation profilePhoto department status');
    
    // Calculate headcount for each department
    const departmentsWithHeadcount = await Promise.all(
      departments.map(async (dept) => {
        await dept.calculateHeadcount();
        return dept;
      })
    );
    
    res.json({ success: true, data: departmentsWithHeadcount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { departmentId, name, head, target, description } = req.body;
    
    // Check if departmentId already exists
    const existingDept = await Department.findOne({ departmentId });
    if (existingDept) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department ID already exists' 
      });
    }

    const department = new Department({
      departmentId,
      name,
      head: head ? head.trim() : null,
      target: target || 0,
      description,
      createdBy: req.user.id
    });

    await department.save();
    await department.calculateHeadcount(); // Calculate initial headcount
    await department.populate('headDetails', 'name email employeeId profilePhoto');
    
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { head, ...updateData } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { 
        ...updateData, 
        head: head ? head.trim() : null
      },
      { new: true, runValidators: true }
    ).populate('headDetails', 'name email employeeId profilePhoto department designation');

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Update headcount after department update
    await department.calculateHeadcount();

    res.json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employees by department - FIXED VERSION
const getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findOne({ departmentId: id });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // FIX: Look for employees by department name instead of departmentId
    const employees = await Employee.find({ 
      department: department.name, // Changed from department.departmentId to department.name
      status: 'active'
    }).select('name employeeId email designation profilePhoto department dateOfJoining');

    res.json({ 
      success: true, 
      data: {
        department: {
          _id: department._id,
          departmentId: department.departmentId,
          name: department.name,
          head: department.head,
          headcount: department.headcount,
          target: department.target
        },
        employees
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Designation Controllers
const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find()
      .populate('departmentDetails', 'name departmentId');
    res.json({ success: true, data: designations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDesignation = async (req, res) => {
  try {
    const { title, level, department, description } = req.body;
    
    let departmentRef = null;
    if (department && department.trim() !== '') {
      const dept = await Department.findOne({ departmentId: department.trim() });
      if (dept) {
        departmentRef = dept._id;
      }
    }

    const designation = new Designation({
      title,
      level,
      department: department ? department.trim() : null,
      departmentRef,
      description,
      createdBy: req.user.id
    });

    await designation.save();
    await designation.populate('departmentDetails', 'name departmentId');
    
    res.status(201).json({ success: true, data: designation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { department, ...updateData } = req.body;
    
    let departmentRef = null;
    if (department && department.trim() !== '') {
      const dept = await Department.findOne({ departmentId: department.trim() });
      if (dept) {
        departmentRef = dept._id;
      }
    }

    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      { 
        ...updateData, 
        department: department ? department.trim() : null,
        departmentRef 
      },
      { new: true, runValidators: true }
    ).populate('departmentDetails', 'name departmentId');

    if (!designation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }

    res.json({ success: true, data: designation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);
    
    if (!designation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }

    res.json({ success: true, message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employees by designation
const getDesignationEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employees = await Employee.find({ 
      designation: id,
      status: 'active'
    }).select('name employeeId email designation profilePhoto department dateOfJoining');

    res.json({ 
      success: true, 
      data: {
        designation: id,
        employees
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Location Controllers
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, address, city, state, country, postalCode, timezone } = req.body;
    
    const location = new Location({
      name,
      address,
      city,
      state,
      country,
      postalCode,
      timezone: timezone || 'UTC',
      createdBy: req.user.id
    });

    await location.save();
    
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employees by location
const getLocationEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employees = await Employee.find({ 
      location: id,
      status: 'active'
    }).select('name employeeId email designation profilePhoto department location dateOfJoining');

    res.json({ 
      success: true, 
      data: {
        location: id,
        employees
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update all headcounts
const updateAllHeadcounts = async (req, res) => {
  try {
    const result = await Department.updateAllHeadcounts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getDesignationEmployees,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationEmployees,
  updateAllHeadcounts
};