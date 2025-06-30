import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'review', 'interview', 'rejected', 'accepted', 'withdrawn'],
    default: 'applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  currentCompany: String,
  linkedinProfile: String,
  resume: {
    type: String,
    required: true
  },
  coverLetter: String,
  coverLetterFile: String,
  feedback: String,
  interviewDate: Date,
  nextStep: String,
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['applied', 'review', 'interview', 'rejected', 'accepted', 'withdrawn'],
      },
      date: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ]
}, {
  timestamps: true
});

// Create a compound index to ensure a user can only apply once to a specific job
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;