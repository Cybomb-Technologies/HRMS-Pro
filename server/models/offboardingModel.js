const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});

const offboardingStepSchema = new mongoose.Schema({
  stepId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  assignedTo: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  required: {
    type: Boolean,
    default: true
  },
  estimatedDays: {
    type: Number,
    default: 1
  },
  documents: [documentSchema]
});

const offboardingSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  lastWorkingDay: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    enum: ['resignation', 'termination', 'retirement', 'end-of-contract', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'pending-final', 'completed', 'on-hold'],
    default: 'in-progress'
  },
  progress: {
    type: Number,
    default: 0
  },
  currentStep: {
    type: String,
    default: 'Resignation/Termination'
  },
  completedSteps: {
    type: Number,
    default: 0
  },
  totalSteps: {
    type: Number,
    default: 7
  },
  assignedTo: {
    type: String,
    required: true
  },
  steps: [offboardingStepSchema],
  notes: {
    type: String
  },
  finalSettlement: {
    lastSalary: {
      type: Number,
      default: 0
    },
    pendingLeaves: {
      type: Number,
      default: 0
    },
    leaveEncashment: {
      type: Number,
      default: 0
    },
    noticePay: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    totalSettlement: {
      type: Number,
      default: 0
    },
    settlementDate: {
      type: Date
    },
    settlementStatus: {
      type: String,
      enum: ['pending', 'calculated', 'approved', 'paid'],
      default: 'pending'
    }
  },
  assets: [{
    name: String,
    type: String,
    serialNumber: String,
    assignedDate: Date,
    returnedDate: Date,
    condition: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Pre-save middleware to calculate progress
offboardingSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    const completedSteps = this.steps.filter(step => step.completed).length;
    this.completedSteps = completedSteps;
    this.progress = Math.round((completedSteps / this.totalSteps) * 100);
    
    // Find current step (first incomplete step)
    const currentStep = this.steps.find(step => !step.completed);
    this.currentStep = currentStep ? currentStep.name : 'Completed';
    
    // Update status if all steps are completed
    if (completedSteps === this.totalSteps) {
      this.status = 'completed';
    } else if (this.status === 'completed' && completedSteps < this.totalSteps) {
      this.status = 'in-progress';
    }
  }

  // Calculate final settlement if not completed
  if (this.status !== 'completed' && this.finalSettlement) {
    this.calculateFinalSettlement();
  }

  next();
});

// Method to calculate final settlement
offboardingSchema.methods.calculateFinalSettlement = function() {
  const settlement = this.finalSettlement;
  settlement.leaveEncashment = (settlement.pendingLeaves * settlement.lastSalary) / 30;
  settlement.totalSettlement = settlement.lastSalary + 
                              settlement.leaveEncashment + 
                              settlement.noticePay - 
                              settlement.deductions;
};

// Static method to initialize offboarding steps
offboardingSchema.statics.initializeSteps = function(assignedTo = 'HR Manager') {
  return [
    {
      stepId: 1,
      name: 'Resignation/Termination',
      description: 'Process resignation or termination notice',
      completed: false,
      assignedTo: assignedTo,
      required: true,
      estimatedDays: 1,
      documents: []
    },
    {
      stepId: 2,
      name: 'Asset Recovery',
      description: 'Collect company assets and equipment',
      completed: false,
      assignedTo: 'IT Department',
      required: true,
      estimatedDays: 2,
      documents: []
    },
    {
      stepId: 3,
      name: 'Knowledge Handover',
      description: 'Transfer responsibilities and knowledge',
      completed: false,
      assignedTo: assignedTo,
      required: true,
      estimatedDays: 3,
      documents: []
    },
    {
      stepId: 4,
      name: 'Final Timesheet',
      description: 'Submit and approve final timesheet',
      completed: false,
      assignedTo: 'Payroll Department',
      required: true,
      estimatedDays: 1,
      documents: []
    },
    {
      stepId: 5,
      name: 'Leave Encashment',
      description: 'Calculate unused leave encashment',
      completed: false,
      assignedTo: 'Payroll Department',
      required: true,
      estimatedDays: 1,
      documents: []
    },
    {
      stepId: 6,
      name: 'F&F Calculation',
      description: 'Calculate full and final settlement',
      completed: false,
      assignedTo: 'Payroll Department',
      required: true,
      estimatedDays: 2,
      documents: []
    },
    {
      stepId: 7,
      name: 'Profile Deactivation',
      description: 'Deactivate access and archive profile',
      completed: false,
      assignedTo: 'IT Department',
      required: true,
      estimatedDays: 1,
      documents: []
    }
  ];
};

module.exports = mongoose.model('Offboarding', offboardingSchema);