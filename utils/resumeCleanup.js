import fs from 'fs';
import path from 'path';

export const cleanupOrphanedResumes = async () => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads/resumes');
    
    if (!fs.existsSync(uploadDir)) {
      console.log('Uploads directory does not exist, skipping cleanup');
      return 0;
    }

    const files = fs.readdirSync(uploadDir);
    if (files.length === 0) {
      console.log('No files to clean up');
      return 0;
    }

    // Get file info including modification time
    const fileDetails = files.map(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        mtime: stats.mtimeMs, // Last modified time in milliseconds
      };
    });

    // Sort by most recent first
    fileDetails.sort((a, b) => b.mtime - a.mtime);

    // Always keep the most recent file
    const filesToKeep = fileDetails.slice(0, 1).map(f => f.name);
    let deletedCount = 0;

    for (const file of fileDetails) {
      if (!filesToKeep.includes(file.name)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted old resume: ${file.name}`);
          deletedCount++;
        } catch (err) {
          console.error(`Error deleting file ${file.name}:`, err);
        }
      }
    }

    console.log(`Cleanup completed. Kept ${filesToKeep.length} most recent resume, deleted ${deletedCount} old resumes`);
    return deletedCount;

  } catch (error) {
    console.error('Resume cleanup error:', error);
    throw error;
  }
};