import express from 'express';
import Certification from '../models/Certification.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all certifications for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const certifications = await Certification.find({ userId:req.user.id });
    res.json(certifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new certification
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, issuer, date, credentialLink } = req.body;

    const newCertification = new Certification({
      userId: req.user.id,
      title,
      issuer,
      date,
      credentialLink,
    });

    await newCertification.save();
    res.status(201).json(newCertification);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a certification
router.put('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Certification ID:', req.params.id);
    console.log('Request Body:', req.body);
    
    const certification = await Certification.findById(req.params.id);
    if (!certification || certification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    


    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a certification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    // ✅ Debug logs
    console.log('Certification:', certification);
    console.log('User ID from token:', req.user.id);
    console.log('Certification user ID:', certification?.userId);

    if (!certification || certification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await certification.deleteOne();
    res.json({ message: 'Certification deleted' });
  } catch (err) {
    console.error('Delete error:', err); // ✅ Add this to catch errors
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
