// routes/experienceRoutes.js

import express from 'express';
import { getExperiences, createExperience, updateExperience, deleteExperience } from '../controllers/experienceController.js';
import verifyToken from '../middlewares/authMiddleware.js'; // Adjust path as needed

const router = express.Router();

// Protect all routes with verifyToken
router.get('/', verifyToken, getExperiences);
router.post('/', verifyToken, createExperience);
router.put('/:id', verifyToken, updateExperience);
router.delete('/:id', verifyToken, deleteExperience);

export default router;
