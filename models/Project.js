import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [String],
  githubLink: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming user model exists
    required: true
  },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
