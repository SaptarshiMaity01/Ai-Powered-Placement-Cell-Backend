// models/AcademicInfo.js
import mongoose from 'mongoose';

const academicInfoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // assuming one record per user
  },
  rollNumber: String,
  department: String,
  degree: String,
  cgpa: String,
  tenthMarks: String,
  twelfthMarks: String,
}, {
  timestamps: true,
});

const AcademicInfo = mongoose.model('AcademicInfo', academicInfoSchema);
export default AcademicInfo;

