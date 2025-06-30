import express from 'express';
import Job from '../models/Job.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get jobs based on user role
router.get('/', verifyToken, async (req, res) => {
  try {
    let jobs;
    
    // If user is admin or student, show all jobs
    if (req.user.role === 'admin' || req.user.role === 'student') {
      jobs = await Job.find()
        .sort({ createdAt: -1 })
        .populate('applicants', 'name email resume');
    } 
    // If user is company, only show their jobs
    else if (req.user.role === 'company') {
      jobs = await Job.find({ createdBy: req.user.id })
        .sort({ createdAt: -1 })
        .populate('applicants', 'name email resume');
    }
    // Unknown role - return empty list
    else {
      jobs = [];
    }

    res.status(200).json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

// Create new job
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only companies and admins can post jobs' 
      });
    }

    const newJob = new Job({
      ...req.body,
      createdBy: req.user.id
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({
      message: 'Validation Error',
      error: err.message
    });
  }
});

// Update job
router.put('/:id', verifyToken, async (req, res) => {
  try {
    let job;
    
    // Admins can update any job
    if (req.user.role === 'admin') {
      job = await Job.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    } 
    // Companies can only update their own jobs
    else {
      job = await Job.findOneAndUpdate(
        {
          _id: req.params.id,
          createdBy: req.user.id
        },
        req.body,
        { new: true, runValidators: true }
      );
    }

    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found or unauthorized' 
      });
    }

    res.status(200).json(job);
  } catch (err) {
    res.status(400).json({
      message: 'Validation Error',
      error: err.message
    });
  }
});

// Delete job
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    let job;
    
    // Admins can delete any job
    if (req.user.role === 'admin') {
      job = await Job.findByIdAndDelete(req.params.id);
    } 
    // Companies can only delete their own jobs
    else {
      job = await Job.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user.id
      });
    }

    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found or unauthorized' 
      });
    }

    res.status(200).json({ 
      message: 'Job deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

// Duplicate job
router.post('/:id/duplicate', verifyToken, async (req, res) => {
  try {
    let originalJob;
    
    // Admins can duplicate any job
    if (req.user.role === 'admin') {
      originalJob = await Job.findById(req.params.id);
    } 
    // Companies can only duplicate their own jobs
    else {
      originalJob = await Job.findOne({
        _id: req.params.id,
        createdBy: req.user.id
      });
    }

    if (!originalJob) {
      return res.status(404).json({ 
        message: 'Job not found or unauthorized' 
      });
    }

    const newJob = new Job({
      ...originalJob.toObject(),
      _id: undefined,
      status: 'active',
      applicants: [],
      postedDate: new Date()
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

// Update job status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    let job;
    
    // Admins can update status of any job
    if (req.user.role === 'admin') {
      job = await Job.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
    } 
    // Companies can only update status of their own jobs
    else {
      job = await Job.findOneAndUpdate(
        {
          _id: req.params.id,
          createdBy: req.user.id
        },
        { status },
        { new: true }
      );
    }

    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found or unauthorized' 
      });
    }

    res.status(200).json(job);
  } catch (err) {
    res.status(400).json({
      message: 'Validation Error',
      error: err.message
    });
  }
});

// Add to jobRoutes.js
router.get('/count', verifyToken, async (req, res) => {
  try {
    let count;
    
    if (req.user.role === 'admin') {
      count = await Job.countDocuments();
    } 
    else if (req.user.role === 'company') {
      count = await Job.countDocuments({ createdBy: req.user.id });
    }
    else {
      count = 0;
    }

    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

export default router;