import express from 'express';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(verifyToken, getProjects).post(verifyToken, createProject);
router.route('/:id').put(verifyToken, updateProject).delete(verifyToken, deleteProject);

export default router;
