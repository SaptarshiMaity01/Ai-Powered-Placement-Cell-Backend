import express from 'express';
import multer from 'multer';
import { uploadResume } from '../controllers/resumeController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js'; // Import your User model

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, `${req.user.id}-${Date.now()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Middleware to delete old resume

router.post(
  '/upload',
  verifyToken,
  // Add this middleware before upload
  upload.single('resume'),
  uploadResume
);

export default router;