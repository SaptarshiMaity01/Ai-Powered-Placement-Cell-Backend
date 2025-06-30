import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import verifyToken from '../middlewares/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Configuring file upload destination...');
    const uploadDir = path.join(process.cwd(), 'uploads');
    console.log(`Upload directory: ${uploadDir}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      console.log('Upload directory does not exist, creating...');
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    console.log(`Filtering file: ${file.originalname}`);
    const allowedFileTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      console.log('File type accepted');
      cb(null, true);
    } else {
      console.log('File type rejected');
      cb(new Error('Only PDF, DOC and DOCX files are allowed'));
    }
  },
});

const uploadFields = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetterFile', maxCount: 1 },
]);

// Submit a new application - Enhanced with debugging
router.post('/', verifyToken, uploadFields, async (req, res) => {
  console.log('\n--- NEW APPLICATION SUBMISSION STARTED ---');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Uploaded files:', req.files);
  console.log('Authenticated user:', req.user);

  try {
    // Only students can apply for jobs
    if (req.user.role !== 'student') {
      console.log('Application rejected - user role is not student');
      return res.status(403).json({
        message: 'Only students can apply for jobs'
      });
    }
    
    const { jobId, fullName, email, phone, currentCompany, linkedinProfile, coverLetter, useExistingResume } = req.body;
    console.log('Parsed application data:', {
      jobId, fullName, email, phone, currentCompany, linkedinProfile, 
      coverLetter: coverLetter ? 'provided' : 'not provided',
      useExistingResume
    });

    // Check if the job exists
    console.log(`Looking for job with ID: ${jobId}`);
    const job = await Job.findById(jobId);
    if (!job) {
      console.log('Job not found');
      return res.status(404).json({ message: 'Job not found' });
    }
    console.log('Found job:', job.title);

    // Check if the job is open for applications
    if (job.status !== 'active') {
      console.log('Job is not active for applications');
      return res.status(400).json({
        message: 'This job is no longer accepting applications'
      });
    }

    // Check if the user has already applied for this job
    console.log('Checking for existing applications...');
    const existingApplication = await Application.findOne({
      applicant: req.user.id,
      job: jobId
    });
    
    if (existingApplication) {
      console.log('User has already applied to this job');
      return res.status(400).json({
        message: 'You have already applied for this job'
      });
    }

    // Create application object
    const application = new Application({
      applicant: req.user.id,
      job: jobId,
      fullName,
      email,
      phone,
      status: 'applied',
      appliedDate: new Date(),
      currentCompany: currentCompany || undefined,
      linkedinProfile: linkedinProfile || undefined,
      coverLetter: coverLetter || undefined,
    });
    console.log('Created application object:', application);

    // Handle resume
    
    
    if (useExistingResume) {
      console.log('Using existing resume option selected');
      
      // First check if resumeUrl was provided in form data
      if (req.body.resumeUrl) {
        console.log('Using resumeUrl from form data:', req.body.resumeUrl);
        application.resume = req.body.resumeUrl;
      } 
      // Fall back to user's profile resume
      else {
        console.log('Checking user profile for resume');
        const user = await User.findById(req.user.id);
        if (!user?.resume) {
          console.log('No resume found in user profile');
          return res.status(400).json({
            message: 'No resume found in your profile. Please upload a resume.'
          });
        }
        application.resume = user.resume;
        console.log('Using resume from profile:', user.resume);
      }
    } 
    else if (req.files?.resume) {
      console.log('Using uploaded resume file');
      application.resume = req.files.resume[0].path;
      console.log('Resume path:', req.files.resume[0].path);
      
      // Update user's resume if they don't have one
      const user = await User.findById(req.user.id);
      if (!user.resume) {
        console.log('Updating user profile with new resume');
        await User.findByIdAndUpdate(req.user.id, {
          resume: req.files.resume[0].path
        });
      }
    } 
    else {
      console.log('No resume provided');
      return res.status(400).json({
        message: 'Please provide a resume'
      });
    }
    
    // Handle cover letter file
    if (req.files?.coverLetterFile) {
      console.log('Found cover letter file');
      application.coverLetterFile = req.files.coverLetterFile[0].path;
      console.log('Cover letter path:', req.files.coverLetterFile[0].path);
    }

    // Save application
    console.log('Saving application to database...');
    await application.save();
    console.log('Application saved successfully:', application._id);

    // Update job's applicants array
    console.log('Updating job applicants array...');
    await Job.findByIdAndUpdate(jobId, {
      $push: { applicants: req.user.id }
    });
    console.log('Job applicants array updated');

    res.status(201).json(application);
    console.log('--- APPLICATION SUBMISSION COMPLETED SUCCESSFULLY ---\n');
  } catch (err) {
    console.error('\n--- APPLICATION SUBMISSION FAILED ---');
    console.error('Error details:', err);
    console.error('Error stack:', err.stack);
    console.error('Request body:', req.body);
    console.error('Request files:', req.files);
    console.error('--- END OF ERROR ---\n');
    
    // Clean up uploaded files if error occurred
    if (req.files?.resume) {
      console.log('Cleaning up uploaded resume file');
      fs.unlink(req.files.resume[0].path, () => {});
    }
    if (req.files?.coverLetterFile) {
      console.log('Cleaning up uploaded cover letter file');
      fs.unlink(req.files.coverLetterFile[0].path, () => {});
    }

    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
});

// Debugging middleware to log all incoming requests
router.use((req, res, next) => {
  console.log('\n--- INCOMING REQUEST ---');
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  console.log('----------------------\n');
  next();
});

// Get applications for student view
router.get('/student', verifyToken, async (req, res) => {
  try {
    // Only students can view their own applications
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const applications = await Application.find({ applicant: req.user.id })
      .populate('job', 'title company logo')
      .sort({ appliedDate: -1 });

    // Transform data for frontend
    const formattedApplications = applications.map(app => ({
      id: app._id,
      jobTitle: app.job.title,
      company: app.job.company,
      logo: app.job.logo,
      status: app.status,
      appliedDate: new Date(app.appliedDate).toLocaleDateString(),
      interviewDate: app.interviewDate ? new Date(app.interviewDate).toLocaleString() : null,
      nextStep: app.nextStep,
      feedback: app.feedback
    }));

    res.status(200).json(formattedApplications);
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
});

// Update application status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, feedback, interviewDate, nextStep } = req.body;
    
    // Find and update application
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(feedback && { feedback }),
        ...(interviewDate && { interviewDate: new Date(interviewDate) }),
        ...(nextStep && { nextStep }),
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: req.user.id
          }
        }
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json(application);
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
});
 
// Get all applications (for admin/recruiter)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Only recruiters/admins can view applications
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let query = {};
    let populateOptions = [
      { path: 'applicant', select: 'name email avatar' },
      { path: 'job', select: 'title company createdBy' }
    ];

    // If recruiter, only get applications for jobs they created
    if (req.user.role === 'company') {
      // First find all jobs created by this recruiter
      const recruiterJobs = await Job.find({ createdBy: req.user.id }, '_id');
      const jobIds = recruiterJobs.map(job => job._id);
      
      // Only query applications for these job IDs
      query.job = { $in: jobIds };
    }

    const applications = await Application.find(query)
      .populate(populateOptions)
      .sort({ appliedDate: -1 });

    // Transform data for frontend
    const formattedApplications = applications.map(app => {
      // Additional security check for recruiters
      if (req.user.role === 'company' && app.job.createdBy.toString() !== req.user.id) {
        return null; // This shouldn't happen due to our query, but just in case
      }

      return {
        id: app._id,
        name: app.fullName || app.applicant?.name || "No name provided",
        phone: app.phone || app.applicant?.phone || "No phone provided",
        email: app.email || app.applicant?.email || "No email provided",
        avatar: app.applicant?.avatar,
        jobTitle: app.job?.title || "Unknown job",
        company: app.job?.company || "Unknown company",
        status: app.status,
        appliedDate: new Date(app.appliedDate).toLocaleDateString(),
        resumeUrl: app.resume,
        feedback: app.feedback,
        interviewDate: app.interviewDate ? new Date(app.interviewDate).toLocaleString() : null,
        nextStep: app.nextStep,
        currentCompany:app.currentCompany || undefined,
        linkedinProfile:app.linkedinProfile || undefined,
      };
    }).filter(app => app !== null); // Filter out any null entries from the security check

    res.status(200).json(formattedApplications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
});

// Add to applicationRoutes.js
router.get('/count', verifyToken, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'company') {
      const recruiterJobs = await Job.find({ createdBy: req.user.id }, '_id');
      query.job = { $in: recruiterJobs.map(job => job._id) };
    }

    const count = await Application.countDocuments(query);
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

router.get('/student/count', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const count = await Application.countDocuments({ applicant: req.user.id });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

// Get statistics for ONLY the currently authenticated student
router.get('/student/stats', verifyToken, async (req, res) => {
  try {
    // Double-check the user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access this data' });
    }

    // ONLY find applications for this specific student
    const applications = await Application.find({ 
      applicant: req.user.id // Using the logged-in user's ID
    });

    const stats = {
      totalApplications: applications.length,
      interviewsScheduled: applications.filter(a => a.status === 'interview').length,
      acceptedOffers: applications.filter(a => a.status === 'offered').length,
      applied: applications.filter(a => a.status === 'applied').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      interview: applications.filter(a => a.status === 'interview').length,
      accepted: applications.filter(a => a.status === 'accepted').length
    };

    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
});
export default router;