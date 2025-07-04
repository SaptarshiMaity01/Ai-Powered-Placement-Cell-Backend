import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: { type: String, required: true },
  company: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });


const Experience = mongoose.model('Experience', experienceSchema);
export default Experience;