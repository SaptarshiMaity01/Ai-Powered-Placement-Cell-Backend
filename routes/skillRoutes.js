import express from 'express';
import { getUserSkills, addUserSkill, removeUserSkill } from '../controllers/skillController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(verifyToken, getUserSkills).post(verifyToken, addUserSkill);
router.delete('/:skill', verifyToken, removeUserSkill);

export default router;
