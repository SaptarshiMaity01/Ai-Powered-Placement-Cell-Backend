import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  });

export default router;