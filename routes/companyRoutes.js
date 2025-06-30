import express from 'express';
import User from '../models/User.js';
import verifyToken from '../middlewares/authMiddleware.js';
import { body, param } from 'express-validator';
import validateRequest from '../middlewares/validateRequest.js';

const router = express.Router();

// Get all companys (admin only) with pagination
router.get('/', verifyToken, async (req, res) => {
    console.log('🔍 Incoming request to GET /api/companys');
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [companys, total] = await Promise.all([
      User.find({ role: 'company' })
        .select('-password')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'company' })
    ]);

    console.log(`Fetched ${companys.length} companys on page ${page}`); // ✅ Console log here

    res.json({
      data: companys,
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

// Get company by ID (admin only)
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

      const company = await User.findOne({
        _id: req.params.id,
        role: 'company',
      }).select('-password');

      if (!company) {
        return res.status(404).json({ message: 'company not found' });
      }

      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update company
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

      const company = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'company' },
        req.body,
        { new: true }
      ).select('-password');

      if (!company) {
        return res.status(404).json({ message: 'company not found' });
      }

      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update company status (active/inactive)
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

      const company = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'company' },
        { isActive },
        { new: true }
      ).select('-password');

      if (!company) {
        return res.status(404).json({ message: 'company not found' });
      }

      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete company
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

      const company = await User.findOneAndDelete({
        _id: req.params.id,
        role: 'company'
      });

      if (!company) {
        return res.status(404).json({ message: 'company not found' });
      }

      res.json({ message: 'company deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;