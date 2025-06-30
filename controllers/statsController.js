import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

// @desc    Get system statistics
// @route   GET /api/stats
// @access  Authenticated (role-specific)
export const getSystemStats = async (req, res) => {
  try {
    const stats = {};
    const { role, _id: userId } = req.user;

    // Admin gets all counts
    if (role === 'admin') {
      stats.students = await User.countDocuments({ role: 'student' });
      stats.recruiters = await User.countDocuments({ role: 'company' });
      stats.jobs = await Job.countDocuments();
      stats.applications = await Application.countDocuments();
    }
    // Company gets their own job and application counts
    else if (role === 'company') {
      const jobIds = await Job.find({ createdBy: userId }, '_id');
      stats.jobs = jobIds.length;
      stats.applications = await Application.countDocuments({ 
        job: { $in: jobIds } 
      });
    }
    // Student gets their application count
    else if (role === 'student') {
      stats.applications = await Application.countDocuments({ 
        applicant: userId 
      });
      stats.jobs = await Job.countDocuments({ status: 'active' });
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};