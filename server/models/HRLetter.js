// models/HRLetter.js
const mongoose = require('mongoose');

const hrLetterSchema = new mongoose.Schema({
  letterType: {
    type: String,
    required: true,
    enum: ['offer', 'appointment', 'hike', 'promotion', 'termination', 'experience']
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true
  },
  candidateAddress: String,
  designation: {
    type: String,
    required: true
  },
  department: String,
  salary: {
    basic: Number,
    hra: Number,
    specialAllowance: Number,
    total: Number
  },
  joiningDate: Date,
  effectiveDate: Date,
  reason: String,
  duration: String,
  
  // Company Details
  companyDetails: {
    name: {
      type: String,
      required: true,
      default: 'Cybomb Technologies LLP'
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    phone: String,
    email: String,
    website: String,
    hrManagerName: {
      type: String,
      default: 'HR Manager'
    }
  },
  
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  letterContent: {
    html: String,
    pdfBuffer: {
      type: Buffer,
      select: false
    }
  },
  fileName: String,
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent'],
    default: 'generated'
  },
  
  // Track modifications
  modifiedData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isModified: {
    type: Boolean,
    default: false
  },
  originalLetterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HRLetter',
    default: null
  }
}, {
  timestamps: true
});

// Virtual for download URL
hrLetterSchema.virtual('downloadUrl').get(function() {
  return `/api/hrletters/download/${this._id}`;
});

// Method to check if PDF is available
hrLetterSchema.methods.hasPDF = function() {
  return this.letterContent.pdfBuffer && 
         Buffer.isBuffer(this.letterContent.pdfBuffer) && 
         this.letterContent.pdfBuffer.length > 0;
};

// Method to get effective data (original or modified)
hrLetterSchema.methods.getEffectiveData = function() {
  if (this.isModified && this.modifiedData) {
    return { ...this.toObject(), ...this.modifiedData };
  }
  return this.toObject();
};

// Index for better performance
hrLetterSchema.index({ letterType: 1, createdAt: -1 });
hrLetterSchema.index({ candidateEmail: 1 });
hrLetterSchema.index({ originalLetterId: 1 });

module.exports = mongoose.model('HRLetter', hrLetterSchema);