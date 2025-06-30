import express from 'express';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply the verifyToken middleware to all routes
router.use(verifyToken);

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/:id')
  .put(updateEvent)
  .delete(deleteEvent);

export default router;