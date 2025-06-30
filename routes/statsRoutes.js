import express from 'express';
import { getSystemStats } from '../controllers/statsController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getSystemStats);

export default router;