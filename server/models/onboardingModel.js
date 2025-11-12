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

const onboardingStepSchema = new mongoose.Schema({
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
  documents: [documentSchema]
});

const onboardingSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['in-progress', 'pending-activation', 'completed', 'on-hold'],
    default: 'in-progress'
  },
  progress: {
    type: Number,
    default: 0
  },
  currentStep: {
    type: String,
    default: 'Offer Letter'
  },
  completedSteps: {
    type: Number,
    default: 0
  },
  totalSteps: {
    type: Number,
    default: 8
  },
  assignedTo: {
    type: String,
    required: true
  },
  steps: [onboardingStepSchema],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate progress
onboardingSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    const completedSteps = this.steps.filter(step => step.completed).length;
    this.completedSteps = completedSteps;
    this.progress = (completedSteps / this.totalSteps) * 100;
    
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
  next();
});

// Static method to initialize onboarding steps
onboardingSchema.statics.initializeSteps = function(assignedTo = 'HR Manager') {
  return [
    {
      stepId: 1,
      name: 'Offer Letter',
      description: 'Send and receive signed offer letter',
      completed: false,
      assignedTo: assignedTo,
      documents: []
    },
    {
      stepId: 2,
      name: 'Document Collection',
      description: 'Collect required documents and KYC',
      completed: false,
      assignedTo: assignedTo,
      documents: []
    },
    {
      stepId: 3,
      name: 'Background Check',
      description: 'Verify employment and education history',
      completed: false,
      assignedTo: assignedTo,
      documents: []
    },
    {
      stepId: 4,
      name: 'Policy Acknowledgment',
      description: 'Review and acknowledge company policies',
      completed: false,
      assignedTo: assignedTo,
      documents: []
    },
    {
      stepId: 5,
      name: 'Equipment Request',
      description: 'Request and assign necessary equipment',
      completed: false,
      assignedTo: 'IT Department',
      documents: []
    },
    {
      stepId: 6,
      name: 'Profile Setup',
      description: 'Complete employee profile and system access',
      completed: false,
      assignedTo: 'IT Department',
      documents: []
    },
    {
      stepId: 7,
      name: 'Manager Assignment',
      description: 'Assign reporting manager and team',
      completed: false,
      assignedTo: assignedTo,
      documents: []
    },
    {
      stepId: 8,
      name: 'Final Activation',
      description: 'Activate employee profile and access',
      completed: false,
      assignedTo: assignedTo,
      documents: []
    }
  ];
};

module.exports = mongoose.model('Onboarding', onboardingSchema);