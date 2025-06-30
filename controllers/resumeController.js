import path from 'path';
import fs from 'fs';
import User from '../models/User.js';

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;

    // Optionally delete the old resume if it exists
    const user = await User.findById(req.user.id);
    if (user && user.resume) {
      const oldFilePath = path.join('uploads/resumes', user.resume);
      
      // Check if file exists before deleting
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath); // Synchronously delete the old file
      }
    }

    // Update the user's resume URL in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { resume: resumeUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ resumeLink: resumeUrl }); // Send the resume URL back to the frontend
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


