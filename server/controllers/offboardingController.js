// controllers/offboardingController.js
const Offboarding = require('../models/offboardingModel');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

/**
 * Helper to parse stepId safely (allow string or number)
 */
const parseStepId = (stepId) => {
  if (typeof stepId === 'number') return stepId;
  if (typeof stepId === 'string' && stepId.trim() !== '') return parseInt(stepId, 10);
  return null;
};

/**
 * Get all offboarding records
 */
const getAllOffboarding = async (req, res) => {
  try {
    const offboardingRecords = await Offboarding.find().sort({ createdAt: -1 });
    return res.json(offboardingRecords);
  } catch (error) {
    console.error('getAllOffboarding error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Upload document (multipart/form-data). Uses multer in route.
 */
const uploadDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { stepId: rawStepId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const stepId = parseStepId(rawStepId);
    if (!stepId) return res.status(400).json({ error: 'stepId is required' });

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    const document = {
      _id: new mongoose.Types.ObjectId(),
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
      status: 'pending'
    };

    const step = offboarding.steps.find(s => s.stepId === stepId);
    if (!step) return res.status(404).json({ error: 'Step not found' });

    step.documents = step.documents || [];
    step.documents.push(document);

    await offboarding.save();
    return res.json({ document, message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('uploadDocument error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Delete document from any step
 */
const deleteDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;
    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    offboarding.steps.forEach(step => {
      if (step.documents && step.documents.length > 0) {
        step.documents = step.documents.filter(doc => doc._id.toString() !== documentId);
      }
    });

    await offboarding.save();
    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('deleteDocument error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get offboarding by employeeId
 */
const getOffboardingByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });
    return res.json(offboarding);
  } catch (error) {
    console.error('getOffboardingByEmployeeId error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Start a new offboarding process
 * - Creates Offboarding doc
 * - Updates Employee.offboardingInProgress=true via employee.save() to trigger pre-save middleware
 */
const startOffboarding = async (req, res) => {
  try {
    const { employeeId, lastWorkingDay, reason, assignedTo, notes } = req.body;

    if (!employeeId || !lastWorkingDay || !reason) {
      return res.status(400).json({ error: 'employeeId, lastWorkingDay and reason are required' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const existingOffboarding = await Offboarding.findOne({ employeeId });
    if (existingOffboarding) {
      return res.status(400).json({ error: 'Offboarding process already exists for this employee' });
    }

    const steps = Offboarding.initializeSteps(assignedTo || 'HR Manager');

    const offboarding = new Offboarding({
      employeeId,
      name: employee.name,
      email: employee.email,
      position: employee.designation || employee.position || '',
      department: employee.department || '',
      startDate: new Date(),
      lastWorkingDay: new Date(lastWorkingDay),
      reason,
      assignedTo: assignedTo || 'HR Manager',
      steps,
      notes,
      status: 'in-progress',
      progress: 0,
      currentStep: 'Resignation/Termination',
      completedSteps: 0,
      totalSteps: steps.length,
      finalSettlement: {
        lastSalary: employee.salary || 0,
        pendingLeaves: employee.pendingLeaves || 0,
        settlementStatus: 'pending'
      }
    });

    // Save offboarding
    await offboarding.save();

    // Update employee using save() to trigger pre-save and set employeeStatus to 'Offboarding'
    employee.offboardingInProgress = true;
    employee.offboardingStartDate = new Date();
    // keep status == active so they can login/participate
    await employee.save();

    return res.status(201).json(offboarding);
  } catch (error) {
    console.error('startOffboarding error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update offboarding top-level status (in-progress | pending-final | completed | on-hold)
 */
const updateOffboardingStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, notes } = req.body;

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    if (status) offboarding.status = status;
    if (notes) offboarding.notes = notes;
    offboarding.updatedAt = new Date();

    await offboarding.save();
    return res.json(offboarding);
  } catch (error) {
    console.error('updateOffboardingStatus error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Complete a single step
 */
const completeStep = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { stepId: rawStepId, notes } = req.body;
    const stepId = parseStepId(rawStepId);
    if (!stepId) return res.status(400).json({ error: 'stepId is required' });

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    const step = offboarding.steps.find(s => s.stepId === stepId);
    if (!step) return res.status(404).json({ error: 'Step not found' });

    if (!step.completed) {
      step.completed = true;
      step.completedAt = new Date();
    }
    if (notes) step.notes = notes;

    // Save and let offboarding pre-save middleware update progress/status
    await offboarding.save();

    return res.json(offboarding);
  } catch (error) {
    console.error('completeStep error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update notes for a step
 */
const updateStepNotes = async (req, res) => {
  try {
    const { employeeId, stepId } = req.params;
    const { notes } = req.body;
    const parsedStepId = parseStepId(stepId);

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    const step = offboarding.steps.find(s => s.stepId === parsedStepId);
    if (!step) return res.status(404).json({ error: 'Step not found' });

    step.notes = notes;
    await offboarding.save();

    return res.json(offboarding);
  } catch (error) {
    console.error('updateStepNotes error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Add asset to offboarding
 */
const addAsset = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const assetData = req.body;

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    offboarding.assets = offboarding.assets || [];
    offboarding.assets.push({
      ...assetData,
      _id: new mongoose.Types.ObjectId(),
      returnedDate: null
    });

    await offboarding.save();
    return res.json(offboarding);
  } catch (error) {
    console.error('addAsset error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Mark asset returned
 */
const returnAsset = async (req, res) => {
  try {
    const { employeeId, assetId } = req.params;
    const { condition, notes } = req.body;

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    const asset = offboarding.assets.id(assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    asset.returnedDate = new Date();
    asset.condition = condition;
    if (notes) asset.notes = notes;

    await offboarding.save();
    return res.json(offboarding);
  } catch (error) {
    console.error('returnAsset error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update final settlement details
 */
const updateFinalSettlement = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const settlementData = req.body;

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    offboarding.finalSettlement = {
      ...offboarding.finalSettlement,
      ...settlementData
    };

    // If method exists, call it to recalc
    if (typeof offboarding.calculateFinalSettlement === 'function') {
      offboarding.calculateFinalSettlement();
    }

    await offboarding.save();
    return res.json(offboarding);
  } catch (error) {
    console.error('updateFinalSettlement error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * COMPLETE OFFBOARDING (defensive, transaction-free)
 */
const completeOffboarding = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });

    const offboarding = await Offboarding.findOne({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // 1) Mark all offboarding steps complete
    offboarding.steps.forEach(step => {
      if (!step.completed) {
        step.completed = true;
        step.completedAt = new Date();
      }
    });
    offboarding.status = 'completed';
    offboarding.progress = 100;
    offboarding.completedSteps = offboarding.steps.length;
    offboarding.currentStep = 'Completed';
    offboarding.updatedAt = new Date();

    // Save offboarding first
    await offboarding.save();

    // 2) Try to update employee via save() so pre('save') runs
    employee.offboardingInProgress = false;
    employee.exitDate = employee.exitDate || new Date();
    // set base status so middleware picks correct branch
    employee.status = 'inactive';

    await employee.save().catch(err => {
      // log but continue to defensive update below
      console.error('employee.save() failed:', err && err.message ? err.message : err);
    });

    // 3) Re-fetch employee to verify
    let updatedEmployee = await Employee.findOne({ employeeId });

    // 4) If still not inactive, force an atomic update (ensures DB reflects expected final state)
    if (!updatedEmployee || updatedEmployee.status !== 'inactive' || updatedEmployee.offboardingInProgress) {
      console.warn('Employee not updated by save(); applying fallback findOneAndUpdate.');

      const forced = await Employee.findOneAndUpdate(
        { employeeId },
        {
          $set: {
            status: 'inactive',
            employeeStatus: 'Inactive',     // bypass middleware by explicitly setting display field
            offboardingInProgress: false,
            exitDate: updatedEmployee?.exitDate || new Date()
          }
        },
        { new: true }
      );

      if (forced) updatedEmployee = forced;
    }

    // 5) Final sanity check
    if (!updatedEmployee || updatedEmployee.status !== 'inactive') {
      console.error('Failed to mark employee inactive after both save() and fallback update.');
      return res.status(500).json({
        success: false,
        message: 'Failed to mark employee inactive. Check DB permissions / middleware.',
        employee: updatedEmployee ? {
          employeeId: updatedEmployee.employeeId,
          status: updatedEmployee.status,
          employeeStatus: updatedEmployee.employeeStatus,
          offboardingInProgress: updatedEmployee.offboardingInProgress
        } : null,
        offboarding
      });
    }

    // 6) Return result
    const updatedOffboarding = await Offboarding.findOne({ employeeId });

    return res.json({
      success: true,
      message: 'Offboarding completed and employee marked inactive',
      offboarding: updatedOffboarding,
      employee: {
        employeeId: updatedEmployee.employeeId,
        status: updatedEmployee.status,
        employeeStatus: updatedEmployee.employeeStatus,
        offboardingInProgress: updatedEmployee.offboardingInProgress,
        exitDate: updatedEmployee.exitDate
      }
    });
  } catch (error) {
    console.error('completeOffboarding (defensive) error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


/**
 * Delete offboarding record entirely
 */
const deleteOffboarding = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const offboarding = await Offboarding.findOneAndDelete({ employeeId });
    if (!offboarding) return res.status(404).json({ error: 'Offboarding record not found' });
    return res.json({ message: 'Offboarding record deleted successfully' });
  } catch (error) {
    console.error('deleteOffboarding error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get offboarding stats
 */
const getOffboardingStats = async (req, res) => {
  try {
    const total = await Offboarding.countDocuments();
    const inProgress = await Offboarding.countDocuments({ status: 'in-progress' });
    const completed = await Offboarding.countDocuments({ status: 'completed' });
    const onHold = await Offboarding.countDocuments({ status: 'on-hold' });
    const pendingFinal = await Offboarding.countDocuments({ status: 'pending-final' });

    const completedOffboardings = await Offboarding.find({ status: 'completed' });
    const avgDuration = completedOffboardings.length > 0
      ? completedOffboardings.reduce((acc, curr) => {
          const duration = Math.ceil((new Date(curr.updatedAt) - new Date(curr.createdAt)) / (1000 * 60 * 60 * 24));
          return acc + duration;
        }, 0) / completedOffboardings.length
      : 0;

    return res.json({
      total,
      inProgress,
      completed,
      onHold,
      pendingFinal,
      avgDuration: Math.round(avgDuration)
    });
  } catch (error) {
    console.error('getOffboardingStats error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Debug route: show employee + offboarding status
 */
const debugEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });
    const offboarding = await Offboarding.findOne({ employeeId });

    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    return res.json({
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        status: employee.status,
        employeeStatus: employee.employeeStatus,
        offboardingInProgress: employee.offboardingInProgress,
        exitDate: employee.exitDate,
        _id: employee._id
      },
      offboarding: offboarding ? {
        status: offboarding.status,
        progress: offboarding.progress,
        currentStep: offboarding.currentStep,
        completedSteps: offboarding.completedSteps,
        totalSteps: offboarding.totalSteps
      } : null
    });
  } catch (error) {
    console.error('debugEmployeeStatus error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Force update employee status to inactive (useful for debugging)
 */
const forceUpdateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    employee.status = 'inactive';
    employee.employeeStatus = 'Inactive';
    employee.offboardingInProgress = false;
    employee.exitDate = new Date();

    await employee.save();

    const updatedEmployee = await Employee.findOne({ employeeId });
    return res.json({
      success: true,
      message: 'Employee status forced to inactive',
      employee: {
        employeeId: updatedEmployee.employeeId,
        status: updatedEmployee.status,
        employeeStatus: updatedEmployee.employeeStatus,
        offboardingInProgress: updatedEmployee.offboardingInProgress
      }
    });
  } catch (error) {
    console.error('forceUpdateEmployeeStatus error:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllOffboarding,
  getOffboardingByEmployeeId,
  startOffboarding,
  updateOffboardingStatus,
  completeStep,
  updateStepNotes,
  addAsset,
  returnAsset,
  updateFinalSettlement,
  completeOffboarding,
  deleteOffboarding,
  getOffboardingStats,
  uploadDocument,
  deleteDocument,
  debugEmployeeStatus,
  forceUpdateEmployeeStatus
};
