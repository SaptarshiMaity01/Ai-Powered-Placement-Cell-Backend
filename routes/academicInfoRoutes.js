import express from 'express';
import { getAcademicInfo, saveAcademicInfo } from '../controllers/academicInfoController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getAcademicInfo);
router.post('/', verifyToken, saveAcademicInfo);

export default router;