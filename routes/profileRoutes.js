import express from 'express';
import { getProfile, saveProfile } from "../controllers/profileController.js";
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get("/", verifyToken, getProfile);
router.post("/", verifyToken, saveProfile);

export default router;
