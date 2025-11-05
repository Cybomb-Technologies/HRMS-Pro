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
  reason: String, // For termination letters
  duration: String, // For experience letters
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  letterContent: {
    html: String,
    pdfBuffer: {
      type: Buffer,
      select: false // Don't include in queries by default to improve performance
    }
  },
  fileName: String,
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent'],
    default: 'generated'
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

// Index for better performance
hrLetterSchema.index({ letterType: 1, createdAt: -1 });
hrLetterSchema.index({ candidateEmail: 1 });

module.exports = mongoose.model('HRLetter', hrLetterSchema);