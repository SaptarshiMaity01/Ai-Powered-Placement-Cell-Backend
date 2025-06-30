import express from 'express';
import User from '../models/User.js';
import verifyToken from '../middlewares/authMiddleware.js';
import { body, param } from 'express-validator';
import validateRequest from '../middlewares/validateRequest.js';

const router = express.Router();

// Get all students (admin only) with pagination
router.get('/', verifyToken, async (req, res) => {
    console.log('🔍 Incoming request to GET /api/students');
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      User.find({ role: 'student' })
        .select('-password')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'student' })
    ]);

    console.log(`Fetched ${students.length} students on page ${page}`); // ✅ Console log here

    res.json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by ID (admin only)
router.get(
  '/:id',
  verifyToken,
  param('id').isMongoId(),
  validateRequest,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }

      const student = await User.findOne({
        _id: req.params.id,
        role: 'student',
      }).select('-password');

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(student);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update student
router.put(
  '/:id',
  verifyToken,
  [
    param('id').isMongoId(),
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('department').optional().trim(),
    body('isActive').isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }

      const student = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'student' },
        req.body,
        { new: true }
      ).select('-password');

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(student);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update student status (active/inactive)
router.patch(
  '/:id/status',
  verifyToken,
  [
    param('id').isMongoId(),
    body('isActive').isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }

      const { isActive } = req.body;

      const student = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'student' },
        { isActive },
        { new: true }
      ).select('-password');

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(student);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete student
router.delete(
  '/:id',
  verifyToken,
  param('id').isMongoId(),
  validateRequest,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }

      const student = await User.findOneAndDelete({
        _id: req.params.id,
        role: 'student'
      });

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json({ message: 'Student deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;